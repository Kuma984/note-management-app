/**
 * Entry point of Member 3's backend module.
 *
 *   const advanced = require('./modules/advanced');
 *   advanced.mountRoutes(app);                     // after express.json()
 *   const server = app.listen(PORT, ...);
 *   advanced.attachRealtime(server);               // WebSocket on /ws
 *
 * Re-exported helpers for Member 2's note routes:
 *   noteLockGuard   - middleware: blocks locked notes without a valid X-Note-Token
 *   toPublicNote    - strips password_hash and hides the content of locked notes
 */
const express = require('express');
const noteAccess = require('./noteAccess');
const realtime = require('./realtime');

function mountRoutes(app) {
  if (!process.env.JWT_SECRET) console.warn('[advanced] JWT_SECRET is not set - protected routes will reject every request');
  const router = express.Router();
  router.use(require('./lock.routes'));
  router.use(require('./share.routes'));
  router.use(require('./ai.routes'));
  app.use('/api', router);
}

module.exports = {
  mountRoutes,
  attachRealtime: realtime.attachRealtime,
  noteLockGuard: noteAccess.noteLockGuard,
  toPublicNote: noteAccess.toPublicNote,
};
