/**
 * Per-note password protection (criteria 23 + 24).
 *
 *  POST /api/notes/:id/lock            enable   {password, confirm_password}
 *  POST /api/notes/:id/unlock          verify   {password}  -> { noteToken }
 *  PUT  /api/notes/:id/lock/password   change   {current_password, new_password, confirm_password}
 *  POST /api/notes/:id/lock/disable    disable  {current_password}
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../../config/db');
const { authenticate, getUserId, asyncHandler } = require('./auth');
const { getNoteAccess, signNoteToken, NOTE_TOKEN_TTL_SECONDS } = require('./noteAccess');
const realtime = require('./realtime');

const router = express.Router();
const MIN_LEN = 6;
const MAX_LEN = 72; // bcrypt only uses the first 72 bytes

// --- brute-force protection: 5 wrong guesses -> 60 s lock-out (per user + note)
const attempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000;

function lockoutRemaining(key) {
  const a = attempts.get(key);
  if (!a || !a.until) return 0;
  if (a.until <= Date.now()) {
    attempts.delete(key);
    return 0;
  }
  return Math.ceil((a.until - Date.now()) / 1000);
}
function recordFailure(key) {
  const a = attempts.get(key) || { count: 0, until: 0 };
  a.count += 1;
  if (a.count >= MAX_ATTEMPTS) {
    a.until = Date.now() + LOCKOUT_MS;
    a.count = 0;
  }
  attempts.set(key, a);
}

function validateNewPassword(password, confirm) {
  if (typeof password !== 'string' || password.length < MIN_LEN) return `Password must be at least ${MIN_LEN} characters.`;
  if (password.length > MAX_LEN) return `Password must be at most ${MAX_LEN} characters.`;
  if (password !== confirm) return 'Password confirmation does not match.';
  return null;
}

const bad = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra });

async function loadOwnedNote(req, res) {
  const noteId = parseInt(req.params.id, 10);
  if (!Number.isInteger(noteId)) {
    bad(res, 400, 'Invalid note id.');
    return null;
  }
  const access = await getNoteAccess(noteId, getUserId(req));
  if (!access) {
    bad(res, 404, 'Note not found.');
    return null;
  }
  if (access.role !== 'owner') {
    bad(res, 403, 'Only the owner can manage the password of this note.');
    return null;
  }
  return access;
}

const tokenPayload = (noteId, userId) => ({
  noteToken: signNoteToken(noteId, userId),
  expiresIn: NOTE_TOKEN_TTL_SECONDS,
});

// Enable protection ------------------------------------------------------------
router.post('/notes/:id/lock', authenticate, asyncHandler(async (req, res) => {
  const access = await loadOwnedNote(req, res);
  if (!access) return;
  if (access.locked) return bad(res, 409, 'This note is already password protected.');
  const { password, confirm_password } = req.body || {};
  const error = validateNewPassword(password, confirm_password);
  if (error) return bad(res, 400, error);

  const hash = await bcrypt.hash(password, 10);
  await pool.query('UPDATE notes SET password_hash = ?, is_locked = 1 WHERE id = ?', [hash, access.note.id]);
  realtime.onLockChanged(access.note.id);
  res.json({ success: true, is_locked: true, ...tokenPayload(access.note.id, getUserId(req)) });
}));

// Unlock (owner or a user the note is shared with) ------------------------------
router.post('/notes/:id/unlock', authenticate, asyncHandler(async (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  if (!Number.isInteger(noteId)) return bad(res, 400, 'Invalid note id.');
  const userId = getUserId(req);
  const access = await getNoteAccess(noteId, userId);
  if (!access) return bad(res, 404, 'Note not found.');
  if (!access.locked) return res.json({ success: true, is_locked: false, noteToken: null });

  const key = `${userId}:${noteId}`;
  const wait = lockoutRemaining(key);
  if (wait > 0) return bad(res, 429, `Too many wrong attempts. Try again in ${wait}s.`, { code: 'TOO_MANY_ATTEMPTS', retryAfter: wait });

  const { password } = req.body || {};
  const ok = typeof password === 'string' && (await bcrypt.compare(password, access.note.password_hash));
  if (!ok) {
    recordFailure(key);
    return bad(res, 403, 'Incorrect password.', { code: 'INVALID_NOTE_PASSWORD' });
  }
  attempts.delete(key);
  res.json({ success: true, is_locked: true, ...tokenPayload(noteId, userId) });
}));

// Change password ----------------------------------------------------------------
router.put('/notes/:id/lock/password', authenticate, asyncHandler(async (req, res) => {
  const access = await loadOwnedNote(req, res);
  if (!access) return;
  if (!access.locked) return bad(res, 400, 'This note is not password protected.');

  const userId = getUserId(req);
  const key = `${userId}:${access.note.id}`;
  const wait = lockoutRemaining(key);
  if (wait > 0) return bad(res, 429, `Too many wrong attempts. Try again in ${wait}s.`, { code: 'TOO_MANY_ATTEMPTS', retryAfter: wait });

  const { current_password, new_password, confirm_password } = req.body || {};
  const ok = typeof current_password === 'string' && (await bcrypt.compare(current_password, access.note.password_hash));
  if (!ok) {
    recordFailure(key);
    return bad(res, 403, 'Current password is incorrect.', { code: 'INVALID_NOTE_PASSWORD' });
  }
  const error = validateNewPassword(new_password, confirm_password);
  if (error) return bad(res, 400, error);

  const hash = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE notes SET password_hash = ? WHERE id = ?', [hash, access.note.id]);
  attempts.delete(key);
  res.json({ success: true, is_locked: true, ...tokenPayload(access.note.id, userId) });
}));

// Disable protection (needs the current password as final confirmation) ----------
router.post('/notes/:id/lock/disable', authenticate, asyncHandler(async (req, res) => {
  const access = await loadOwnedNote(req, res);
  if (!access) return;
  if (!access.locked) return bad(res, 400, 'This note is not password protected.');

  const userId = getUserId(req);
  const key = `${userId}:${access.note.id}`;
  const wait = lockoutRemaining(key);
  if (wait > 0) return bad(res, 429, `Too many wrong attempts. Try again in ${wait}s.`, { code: 'TOO_MANY_ATTEMPTS', retryAfter: wait });

  const { current_password } = req.body || {};
  const ok = typeof current_password === 'string' && (await bcrypt.compare(current_password, access.note.password_hash));
  if (!ok) {
    recordFailure(key);
    return bad(res, 403, 'Current password is incorrect.', { code: 'INVALID_NOTE_PASSWORD' });
  }
  await pool.query('UPDATE notes SET password_hash = NULL, is_locked = 0 WHERE id = ?', [access.note.id]);
  attempts.delete(key);
  res.json({ success: true, is_locked: false });
}));

module.exports = router;
