import api from '../services/api';
import { dbClear } from './db';
import { installOfflineLayer, purgeOtherUsersCache, refreshPending } from './layer';
import { ensureManifestLink, registerServiceWorker } from './register';
import { getSnapshot, setStatus } from './store';
import { syncOutbox } from './sync';

/**
 * Call ONCE in main.jsx, before rendering:   initOffline();
 * Installs the offline layer on the axios instance, registers the service worker and starts
 * the automatic synchronisation (when the connection returns, every 30 s while changes wait,
 * and a health probe while the server is unreachable).
 */
export function initOffline() {
  installOfflineLayer(api);
  ensureManifestLink();
  registerServiceWorker();

  window.addEventListener('online', () => {
    setStatus({ online: true });
    syncOutbox();
  });
  window.addEventListener('offline', () => setStatus({ online: false }));

  setInterval(async () => {
    if (!navigator.onLine) return;
    if (!getSnapshot().online) {
      // browser says "online" but the server did not answer: probe it
      api.get('/health', { __replay: true, timeout: 5000 }).then(() => syncOutbox()).catch(() => {});
      return;
    }
    await refreshPending();
    if (getSnapshot().pending > 0) syncOutbox();
  }, 30000);

  purgeOtherUsersCache();
  refreshPending().then(() => syncOutbox());
}

export { syncOutbox };

/** Optional: call on logout to remove the locally cached notes of this browser. */
export async function clearOfflineCache() {
  try {
    await dbClear('cache');
  } catch (err) {
    /* ignore */
  }
}
