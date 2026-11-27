// Tiny observable store with the offline / sync status (read with useSyncExternalStore).
let snapshot = {
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  pending: 0, // changes saved on this device that are not on the server yet
  syncing: false,
  result: null, // { applied, failed: [{method,url,message}], at } of the last sync
};
const listeners = new Set();

export const getSnapshot = () => snapshot;

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function setStatus(patch) {
  const next = { ...snapshot, ...patch };
  if (Object.keys(patch).every((k) => next[k] === snapshot[k])) return;
  snapshot = next;
  listeners.forEach((l) => l());
}
