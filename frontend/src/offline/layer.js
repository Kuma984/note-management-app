import axios from 'axios';
import { dbAll, dbDelete, dbGet, dbPut } from './db';
import { setStatus } from './store';

/**
 * Transparent offline layer, installed on the shared axios instance (services/api.js).
 *
 *  READ   every successful GET is saved in IndexedDB. When the server cannot be reached the saved
 *         copy is returned instead, so notes, labels, shared notes ... stay visible offline.
 *  WRITE  note / label changes (POST, PUT, PATCH, DELETE) made while offline are stored in an
 *         "outbox", the screens are updated from the local copy, and sync.js sends them in order
 *         when the connection is back.
 *
 * The note screens (Member 2) do not need to know about it. Queued requests resolve with
 * { success: true, queued: true, offline: true, ... } so a UI may show "Saved offline".
 * Password-protected notes are never stored locally and locked notes cannot be changed offline.
 */

const NO_CACHE = [/^\/auth\//, /^\/ai\//, /\/unlock$/];
const QUEUEABLE = [/^\/notes(\/|$)/, /^\/labels(\/|$)/];
const NOT_QUEUEABLE = [/\/lock(\/|$)/, /\/unlock$/, /\/shares(\/|$)/, /\/meta$/];
const SINGLE_NOTE = /^\/(?:shared-notes|notes)\/[^/]+$/;
const TEMP_PREFIX = 'local-';

export const isTempId = (id) => String(id).startsWith(TEMP_PREFIX);
const pathOf = (config) => String(config.url || '').split('?')[0];
const matches = (list, path) => list.some((re) => re.test(path));

export function currentUserId() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')?.id ?? null;
  } catch (err) {
    return null;
  }
}

export const isUnreachable = (err) => axios.isAxiosError(err) && (!err.response || [502, 503, 504].includes(err.response.status));

const synthetic = (config, data, extra = {}) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
  request: null,
  ...extra,
});

// ---------------------------------------------------------------------------------------------
// helpers working on cached JSON without knowing its exact shape: they look for "note-like"
// objects ({id, title, ...}) and arrays containing them.
// ---------------------------------------------------------------------------------------------
const isNoteLike = (o) => o && typeof o === 'object' && !Array.isArray(o) && 'id' in o && 'title' in o;
const sameId = (a, b) => String(a) === String(b);

function containsLocked(node) {
  if (Array.isArray(node)) return node.some(containsLocked);
  if (node && typeof node === 'object') {
    if (node.is_locked === 1 || node.is_locked === true) return true;
    return Object.values(node).some(containsLocked);
  }
  return false;
}

function rewrite(data, { onArray, onObject }) {
  const copy = JSON.parse(JSON.stringify(data));
  const visit = (node) => {
    if (Array.isArray(node)) {
      if (node.some(isNoteLike)) onArray?.(node);
      node.forEach(visit);
    } else if (node && typeof node === 'object') {
      if (isNoteLike(node)) onObject?.(node);
      Object.values(node).forEach(visit);
    }
  };
  visit(copy);
  return copy;
}

async function updateCache(update) {
  const uid = currentUserId();
  if (!uid) return;
  try {
    const entries = await dbAll('cache');
    await Promise.all(
      entries
        .filter((e) => e.uid === uid && /^\/(notes|shared-notes)(\/|$)/.test(e.path))
        .map((e) => update(e))
    );
  } catch (err) {
    /* cache is best effort */
  }
}

const patchNoteInCache = (id, fields) =>
  updateCache((e) =>
    dbPut('cache', {
      ...e,
      data: rewrite(e.data, {
        onObject: (o) => {
          if (sameId(o.id, id) && !(o.is_locked === 1 || o.is_locked === true)) Object.assign(o, fields, { updated_at: new Date().toISOString() });
        },
      }),
    })
  );

const removeNoteFromCache = (id) =>
  updateCache((e) => {
    if (SINGLE_NOTE.test(e.path) && sameId(e.path.split('/').pop(), id)) return dbDelete('cache', e.key);
    return dbPut('cache', {
      ...e,
      data: rewrite(e.data, {
        onArray: (arr) => {
          for (let i = arr.length - 1; i >= 0; i--) if (isNoteLike(arr[i]) && sameId(arr[i].id, id)) arr.splice(i, 1);
        },
      }),
    });
  });

async function insertNoteInCache(note, uid) {
  await updateCache((e) => {
    if (e.key.includes('?') || SINGLE_NOTE.test(e.path)) return undefined; // only plain lists
    return dbPut('cache', { ...e, data: rewrite(e.data, { onArray: (arr) => !arr.some((x) => sameId(x.id, note.id)) && arr.unshift(note) }) });
  });
  // so the editor can open the new note offline
  const key = `${uid}|${axios.getUri({ baseURL: '/api', url: `/notes/${note.id}` })}`;
  await dbPut('cache', { key, uid, path: `/notes/${note.id}`, data: { success: true, note, data: note }, ts: Date.now() });
}

/** After a queued create succeeded: swap the temporary note for the real one everywhere. */
export async function replaceTempNote(tempId, response) {
  const real = response?.note ?? response?.data ?? null;
  await updateCache((e) => {
    if (SINGLE_NOTE.test(e.path) && sameId(e.path.split('/').pop(), tempId)) return dbDelete('cache', e.key);
    if (!real || typeof real !== 'object' || real.id == null) return undefined;
    return dbPut('cache', {
      ...e,
      data: rewrite(e.data, {
        onArray: (arr) => {
          const i = arr.findIndex((x) => isNoteLike(x) && sameId(x.id, tempId));
          if (i >= 0) arr[i] = real;
        },
      }),
    });
  });
}

export async function purgeOtherUsersCache() {
  try {
    const uid = currentUserId();
    const entries = await dbAll('cache');
    await Promise.all(entries.filter((e) => e.uid !== uid).map((e) => dbDelete('cache', e.key)));
  } catch (err) {
    /* ignore */
  }
}

export async function refreshPending() {
  try {
    const uid = currentUserId();
    const entries = await dbAll('outbox');
    setStatus({ pending: entries.filter((e) => e.uid === uid).length });
  } catch (err) {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------------------------
// reading
// ---------------------------------------------------------------------------------------------
const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');

function filterList(data, params) {
  const text = ['search', 'q', 'keyword', 'query', 's'].map((k) => params.get(k)).find(Boolean);
  if (!text) return data;
  const needle = fold(text);
  return rewrite(data, {
    onArray: (arr) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        const n = arr[i];
        if (isNoteLike(n) && !fold(`${n.title} ${n.content}`).includes(needle)) arr.splice(i, 1);
      }
    },
  });
}

async function readCache(api, config) {
  const uid = currentUserId();
  if (!uid) return null;
  const full = api.getUri(config);
  const exact = await dbGet('cache', `${uid}|${full}`);
  if (exact) return exact.data;
  const [base, query] = full.split('?');
  if (query) {
    const list = await dbGet('cache', `${uid}|${base}`);
    if (list) return filterList(list.data, new URLSearchParams(query)); // offline search / filter on the saved list
  }
  return null;
}

async function cacheResponse(api, config, res) {
  const uid = currentUserId();
  const path = pathOf(config);
  if (!uid || !localStorage.getItem('token')) return;
  if (res.status !== 200 || !res.data || typeof res.data !== 'object') return;
  if (matches(NO_CACHE, path)) return;
  if (SINGLE_NOTE.test(path) && containsLocked(res.data)) return; // never keep the body of a locked note
  try {
    await dbPut('cache', { key: `${uid}|${api.getUri(config)}`, uid, path, data: res.data, ts: Date.now() });
  } catch (err) {
    /* ignore (private mode, quota ...) */
  }
}

// ---------------------------------------------------------------------------------------------
// writing while offline
// ---------------------------------------------------------------------------------------------
function readBody(config) {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) return { isForm: true, body: [...config.data.entries()] };
  if (typeof config.data === 'string' && config.data) {
    try {
      return { isForm: false, body: JSON.parse(config.data) };
    } catch (err) {
      return { isForm: false, body: config.data };
    }
  }
  return { isForm: false, body: config.data ?? null };
}

const plainFields = (body, isForm) => (isForm ? Object.fromEntries(body.filter(([, v]) => typeof v === 'string')) : body && typeof body === 'object' ? body : {});
const isPlainObject = (o) => o && typeof o === 'object' && !Array.isArray(o);

async function queueMutation(api, config) {
  const uid = currentUserId();
  if (!uid) return null;
  const method = (config.method || 'post').toLowerCase();
  const path = pathOf(config);
  const { isForm, body } = readBody(config);
  const outbox = (await dbAll('outbox')).filter((e) => e.uid === uid);
  const noteMatch = /^\/notes\/([^/]+)$/.exec(path);
  const ok = (data) => synthetic(config, { success: true, queued: true, offline: true, ...data });

  // 1. create a note
  if (method === 'post' && path === '/notes') {
    const tempId = `${TEMP_PREFIX}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();
    const note = { is_pinned: 0, is_locked: 0, content: '', title: '', ...plainFields(body, isForm), id: tempId, created_at: now, updated_at: now, offline: true };
    await dbPut('outbox', { uid, method, url: config.url, params: config.params, data: body, isForm, tempId, ts: Date.now(), attempts: 0 });
    await insertNoteInCache(note, uid);
    await refreshPending();
    return ok({ id: tempId, noteId: tempId, note, data: note });
  }

  // 2. edit a note
  if ((method === 'put' || method === 'patch') && noteMatch && !isForm && isPlainObject(body)) {
    const id = noteMatch[1];
    const pendingCreate = outbox.find((e) => e.tempId && sameId(e.tempId, id));
    if (pendingCreate && isPlainObject(pendingCreate.data)) {
      await dbPut('outbox', { ...pendingCreate, data: { ...pendingCreate.data, ...body } }); // still not on the server: just update the create
    } else {
      const same = outbox.find((e) => e.method === method && e.url === config.url && !e.isForm && isPlainObject(e.data));
      if (same) await dbPut('outbox', { ...same, data: { ...same.data, ...body } }); // merge auto-save bursts into one request
      else await dbPut('outbox', { uid, method, url: config.url, params: config.params, data: body, isForm, ts: Date.now(), attempts: 0 });
    }
    await patchNoteInCache(id, body);
    await refreshPending();
    return ok({ id, note: { id, ...body } });
  }

  // 3. delete a note
  if (method === 'delete' && noteMatch) {
    const id = noteMatch[1];
    const refersToNote = (url) => url === `/notes/${id}` || String(url).startsWith(`/notes/${id}/`);
    const related = outbox.filter((e) => (e.tempId && sameId(e.tempId, id)) || refersToNote(e.url));
    await Promise.all(related.map((e) => dbDelete('outbox', e.id)));
    if (!isTempId(id)) await dbPut('outbox', { uid, method, url: config.url, params: config.params, data: null, isForm: false, ts: Date.now(), attempts: 0 });
    await removeNoteFromCache(id);
    await refreshPending();
    return ok({ id });
  }

  // 4. anything else under /notes or /labels (labels, attachments, pin ...)
  await dbPut('outbox', { uid, method, url: config.url, params: config.params, data: body, isForm, ts: Date.now(), attempts: 0 });
  const sub = /^\/notes\/([^/]+)\//.exec(path);
  if (sub && isPlainObject(body)) {
    // only reflect the fields that are visible on a note card (e.g. pin), never foreign keys like label ids
    const visible = {};
    ['title', 'content', 'is_pinned', 'pinned_at'].forEach((k) => k in body && (visible[k] = body[k]));
    if (Object.keys(visible).length) await patchNoteInCache(sub[1], visible);
  }
  await refreshPending();
  return ok({ data: body });
}

// ---------------------------------------------------------------------------------------------
// install
// ---------------------------------------------------------------------------------------------
export function installOfflineLayer(api) {
  if (api.__offlineInstalled) return;
  api.__offlineInstalled = true;
  const base = axios.getAdapter(api.defaults.adapter || axios.defaults.adapter);

  async function fallback(config, method, path) {
    if (method === 'get') {
      if (matches(NO_CACHE, path)) return null;
      const data = await readCache(api, config).catch(() => null);
      return data ? synthetic(config, data, { fromCache: true }) : null;
    }
    if (matches(QUEUEABLE, path) && !matches(NOT_QUEUEABLE, path)) return queueMutation(api, config).catch(() => null);
    return null;
  }

  api.defaults.adapter = async (config) => {
    const method = (config.method || 'get').toLowerCase();
    const path = pathOf(config);
    const replay = config.__replay === true;

    if (!replay && navigator.onLine === false) {
      const offline = await fallback(config, method, path);
      if (offline) return offline;
    }
    try {
      const res = await base(config);
      setStatus({ online: true });
      if (method === 'get' && !replay) cacheResponse(api, config, res);
      return res;
    } catch (err) {
      if (!isUnreachable(err)) {
        if (err.response) setStatus({ online: true });
        throw err;
      }
      setStatus({ online: false });
      if (replay) throw err;
      const offline = await fallback(config, method, path);
      if (offline) return offline;
      throw err;
    }
  };
}
