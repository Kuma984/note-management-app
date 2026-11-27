import api from '../../../services/api';

/**
 * Password-protected notes, client side.
 *
 *  - After the right password is entered the server returns a 15-minute "note token".
 *    It is kept in sessionStorage and sent automatically as `X-Note-Token` on every request
 *    for that note (/notes/:id..., /shared-notes/:id..., /ai/notes/:id...).
 *  - If any request gets HTTP 423 NOTE_LOCKED, the password dialog (NoteLockHost) opens and the
 *    request is repeated automatically after a successful unlock. Member 2's code does not
 *    need to do anything special: it only has to handle the promise being rejected when the
 *    user cancels (error.canceled === true).
 */
const STORE_KEY = 'noteUnlockTokens';
const tokens = new Map();

try {
  const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}');
  Object.entries(saved).forEach(([id, value]) => tokens.set(String(id), value));
} catch (err) {
  /* sessionStorage unavailable */
}

function persist() {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(Object.fromEntries(tokens)));
  } catch (err) {
    /* ignore */
  }
}

export function getNoteToken(noteId) {
  const entry = tokens.get(String(noteId));
  if (!entry) return null;
  if (entry.exp <= Date.now() + 5000) {
    tokens.delete(String(noteId));
    persist();
    return null;
  }
  return entry.token;
}

export function setNoteToken(noteId, token, expiresInSec = 900) {
  tokens.set(String(noteId), { token, exp: Date.now() + expiresInSec * 1000 });
  persist();
}

export function clearNoteToken(noteId) {
  tokens.delete(String(noteId));
  persist();
}

// ---- unlock prompt bridge (the dialog lives in NoteLockHost) -------------------------------
let hosts = 0;
const pending = new Map();

export function registerUnlockHost() {
  hosts += 1;
  return () => {
    hosts -= 1;
  };
}

const cancelled = (message) => Object.assign(new Error(message), { canceled: true });

/** Ask the user for the password of a note. Resolves with the note token, rejects if cancelled. */
export function requestUnlock(noteId) {
  const key = String(noteId);
  if (pending.has(key)) return pending.get(key).promise;
  if (hosts === 0) return Promise.reject(cancelled('No unlock dialog is mounted'));
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  pending.set(key, { promise, resolve, reject });
  window.dispatchEvent(new CustomEvent('note-unlock-request', { detail: { noteId: key } }));
  return promise;
}

export function settleUnlock(noteId, ok) {
  const key = String(noteId);
  const entry = pending.get(key);
  if (!entry) return;
  pending.delete(key);
  if (ok) entry.resolve(getNoteToken(key));
  else entry.reject(cancelled('Unlock cancelled'));
}

// ---- axios interceptors ------------------------------------------------------------------------
const NOTE_URL = /(?:^|\/)(?:notes|shared-notes)\/(\d+)(?:\/|$|\?)/;

export function installNoteLockInterceptors() {
  if (api.__noteLockInstalled) return;
  api.__noteLockInstalled = true;

  api.interceptors.request.use((config) => {
    const match = NOTE_URL.exec(config.url || '');
    if (match) {
      const token = getNoteToken(match[1]);
      if (token) config.headers['X-Note-Token'] = token;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const res = error.response;
      if (res?.status === 423 && res.data?.code === 'NOTE_LOCKED' && !error.config?.__lockRetried) {
        try {
          await requestUnlock(res.data.noteId);
        } catch (cancel) {
          error.canceled = true;
          return Promise.reject(error);
        }
        error.config.__lockRetried = true;
        return api.request(error.config);
      }
      return Promise.reject(error);
    }
  );
}

installNoteLockInterceptors();
