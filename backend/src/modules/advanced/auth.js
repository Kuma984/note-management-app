/**
 * Minimal JWT helpers used by the "advanced" module (note lock, sharing, AI, realtime).
 *
 * If Member 1 already attaches `req.user` in his own middleware, that is reused.
 * Otherwise the Bearer token is verified here with JWT_SECRET (same secret as login).
 * The user id is read from any of: id / userId / user_id / sub.
 */
const jwt = require('jsonwebtoken');

function getUserId(req) {
  const u = req.user || {};
  const id = u.id ?? u.userId ?? u.user_id ?? req.userId ?? null;
  return id == null ? null : Number(id);
}

function verifyAccessToken(token) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const id = payload.id ?? payload.userId ?? payload.user_id ?? payload.sub;
  if (id == null) throw new Error('Token has no user id');
  return { id: Number(id), payload };
}

function authenticate(req, res, next) {
  if (getUserId(req) != null) return next();
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });
  try {
    const { id, payload } = verifyAccessToken(token);
    req.user = { ...payload, id };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/** Wrap async route handlers so errors become JSON 500 responses. */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.error(`[advanced] ${req.method} ${req.originalUrl}:`, err);
    if (!res.headersSent) res.status(500).json({ success: false, message: 'Internal server error' });
  });

module.exports = { getUserId, verifyAccessToken, authenticate, asyncHandler };
