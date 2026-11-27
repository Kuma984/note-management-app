/**
 * Minimal promise wrapper around IndexedDB (the "local database" of the offline feature).
 *   store "cache"  : last successful GET responses   { key, uid, path, data, ts }
 *   store "outbox" : changes made offline waiting to be sent   { id, uid, method, url, ... }
 */
const DB_NAME = 'noteapp-offline';
const DB_VERSION = 1;
let dbPromise = null;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not available'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

function run(storeName, mode, action) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const request = action(tx.objectStore(storeName));
        tx.oncomplete = () => resolve(request ? request.result : undefined);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

export const dbGet = (store, key) => run(store, 'readonly', (s) => s.get(key));
export const dbPut = (store, value) => run(store, 'readwrite', (s) => s.put(value));
export const dbDelete = (store, key) => run(store, 'readwrite', (s) => s.delete(key));
export const dbAll = (store) => run(store, 'readonly', (s) => s.getAll());
export const dbClear = (store) => run(store, 'readwrite', (s) => s.clear());
