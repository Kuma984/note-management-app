/**
 * Note access control + password-lock guard.
 *
 * HOW THE LOCK WORKS
 *  - A locked note stores a bcrypt hash in notes.password_hash and notes.is_locked = 1.
 *  - POST /api/notes/:id/unlock verifies the password and returns a short-lived "note token"
 *    (JWT, 15 min, bound to this note AND this user).
 *  - The browser sends it as header `X-Note-Token`; `noteLockGuard` rejects every request on a
 *    locked note that does not carry a valid token with HTTP 423 { code: 'NOTE_LOCKED' }.
 *
 * MEMBER 2: put `noteLockGuard` on every route that has `/:id` (view, edit, delete, pin, labels,
 * attachments ...) and run list rows through `toPublicNote()` before sending them.
 */
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');
const { authenticate, getUserId } = require('./auth');

const NOTE_TOKEN_TTL_SECONDS = 15 * 60;

const noteSecret = () => `${process.env.JWT_SECRET}:note-unlock`;

function signNoteToken(noteId, userId) {
  return jwt.sign({ typ: 'note-unlock', nid: Number(noteId), uid: Number(userId) }, noteSecret(), {
    expiresIn: NOTE_TOKEN_TTL_SECONDS,
  });
}

function verifyNoteToken(token, noteId, userId) {
  if (!token) return false;
  try {
    const p = jwt.verify(token, noteSecret());
    return p.typ === 'note-unlock' && Number(p.nid) === Number(noteId) && Number(p.uid) === Number(userId);
  } catch (err) {
    return false;
  }
}

/**
 * Returns null when the note does not exist or the user has no access,
 * otherwise { note, role: 'owner' | 'edit' | 'read', locked }.
 */
async function getNoteAccess(noteId, userId) {
  const [rows] = await pool.query(
    `SELECT n.id, n.user_id, n.title, n.is_locked, n.password_hash, n.updated_at,
            s.permission AS share_permission, s.shared_at
       FROM notes n
       LEFT JOIN note_shares s ON s.note_id = n.id AND s.shared_with_user_id = ?
      WHERE n.id = ?`,
    [userId, noteId]
  );
  const note = rows[0];
  if (!note) return null;
  let role = null;
  if (Number(note.user_id) === Number(userId)) role = 'owner';
  else if (note.share_permission === 'edit') role = 'edit';
  else if (note.share_permission === 'read') role = 'read';
  if (!role) return null;
  return { note, role, locked: !!note.is_locked };
}

/** Express middleware: blocks locked notes unless a valid X-Note-Token is present. */
function noteLockGuard(req, res, next) {
  authenticate(req, res, async () => {
    try {
      const noteId = parseInt(req.params.id, 10);
      if (!Number.isInteger(noteId)) return next(); // not a note route; nothing to guard
      const userId = getUserId(req);
      const access = await getNoteAccess(noteId, userId);
      if (!access) return next(); // let the real handler answer 404 / 403
      req.noteAccess = access;
      if (!access.locked) return next();
      if (verifyNoteToken(req.get('x-note-token'), noteId, userId)) return next();
      return res.status(423).json({
        success: false,
        code: 'NOTE_LOCKED',
        noteId,
        message: 'This note is password protected. Enter its password to continue.',
      });
    } catch (err) {
      return next(err);
    }
  });
}

/** Remove secrets and hide the body of locked notes (use for list endpoints). */
function toPublicNote(note) {
  if (!note) return note;
  const { password_hash, ...rest } = note;
  if (rest.is_locked) return { ...rest, content: null };
  return rest;
}

module.exports = {
  NOTE_TOKEN_TTL_SECONDS,
  signNoteToken,
  verifyNoteToken,
  getNoteAccess,
  noteLockGuard,
  toPublicNote,
};
