import api from '../services/api';
import { currentUserId, isUnreachable, refreshPending, replaceTempNote } from './layer';
import { dbAll, dbDelete, dbPut } from './db';
import { setStatus } from './store';

/**
 * Sends the changes that were made offline to the server, oldest first.
 *  - temporary ids ("local-xxxx") are replaced by the ids the server returns
 *  - 5xx / network problems: stop and retry later (the change stays in the outbox)
 *  - 401 (session expired) or a cancelled unlock: stop, keep the change
 *  - other 4xx: the server refused the change - it is dropped and reported to the user
 * Conflict policy: last write wins (the user's offline edit is applied on top of the server copy).
 */
const ID_MAP_KEY = 'offlineIdMap';
let running = false;

const loadIdMap = () => {
  try {
    return JSON.parse(localStorage.getItem(ID_MAP_KEY) || '{}');
  } catch (err) {
    return {};
  }
};
const saveIdMap = (map) => {
  try {
    localStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
  } catch (err) {
    /* ignore */
  }
};

const remapString = (text, map) => Object.keys(map).reduce((s, tempId) => s.split(tempId).join(map[tempId]), text);
const remapValue = (value, map) => (value == null ? value : JSON.parse(remapString(JSON.stringify(value), map)));

function rebuildForm(entries, map) {
  const form = new FormData();
  entries.forEach(([key, value]) => form.append(key, typeof value === 'string' ? remapString(value, map) : value));
  return form;
}

const extractId = (data) => data?.note?.id ?? data?.data?.id ?? data?.id ?? data?.noteId ?? data?.insertId ?? null;

export async function syncOutbox() {
  if (running || navigator.onLine === false) return;
  const uid = currentUserId();
  if (!uid || !localStorage.getItem('token')) return;
  running = true;
  setStatus({ syncing: true });

  let applied = 0;
  const failed = [];
  const idMap = loadIdMap();
  try {
    const entries = (await dbAll('outbox')).filter((e) => e.uid === uid).sort((a, b) => a.id - b.id);
    for (const entry of entries) {
      try {
        const res = await api.request({
          method: entry.method,
          url: remapString(entry.url, idMap),
          params: entry.params,
          data: entry.isForm ? rebuildForm(entry.data, idMap) : remapValue(entry.data, idMap),
          __replay: true,
        });
        if (entry.tempId) {
          const realId = extractId(res.data);
          if (realId != null) {
            idMap[entry.tempId] = String(realId);
            saveIdMap(idMap);
          }
          await replaceTempNote(entry.tempId, res.data);
        }
        await dbDelete('outbox', entry.id);
        applied += 1;
      } catch (err) {
        const status = err.response?.status;
        if (isUnreachable(err) || status === 401 || (status === 423 && err.canceled)) break;
        if (status >= 500) {
          if (entry.attempts >= 4) {
            failed.push({ method: entry.method, url: entry.url, message: 'The server could not process this change.' });
            await dbDelete('outbox', entry.id);
            continue;
          }
          await dbPut('outbox', { ...entry, attempts: entry.attempts + 1 });
          break;
        }
        failed.push({ method: entry.method, url: entry.url, message: err.response?.data?.message || err.message });
        await dbDelete('outbox', entry.id);
      }
    }
  } finally {
    running = false;
    await refreshPending();
    setStatus({ syncing: false, result: applied || failed.length ? { applied, failed, at: Date.now() } : null });
    if (applied) window.dispatchEvent(new CustomEvent('offline-sync-complete', { detail: { applied } }));
  }
}
