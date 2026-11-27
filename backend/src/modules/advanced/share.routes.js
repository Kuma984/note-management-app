/**
 * Sharing notes (criterion 25) + the data needed by the collaboration UI.
 *
 *  GET    /api/notes/:id/meta                  role / lock / share counts of one note (any user with access)
 *  GET    /api/notes/:id/shares                owner: list recipients
 *  POST   /api/notes/:id/shares                owner: share  {emails: [...], permission: 'read'|'edit'}
 *  PUT    /api/notes/:id/shares/:shareId       owner: change permission {permission}
 *  DELETE /api/notes/:id/shares/:shareId       owner: revoke
 *  GET    /api/shared-notes[?since=ISO]        recipient: notes shared with me
 *  GET    /api/shared-notes/:id                recipient: open one shared note
 */
const express = require('express');
const { pool } = require('../../config/db');
const { authenticate, getUserId, asyncHandler } = require('./auth');
const { getNoteAccess, noteLockGuard } = require('./noteAccess');
const { sendShareNotification } = require('./mailer');
const realtime = require('./realtime');

const router = express.Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERMISSIONS = ['read', 'edit'];
const MAX_RECIPIENTS = 20;

const bad = (res, status, message, extra = {}) => res.status(status).json({ success: false, message, ...extra });

function requireOwner(req, res) {
  const access = req.noteAccess;
  if (!access) {
    bad(res, 404, 'Note not found.');
    return null;
  }
  if (access.role !== 'owner') {
    bad(res, 403, 'Only the owner can manage sharing of this note.');
    return null;
  }
  return access;
}

// Basic info about a note for the current user (no content) ------------------------
router.get('/notes/:id/meta', authenticate, asyncHandler(async (req, res) => {
  const noteId = parseInt(req.params.id, 10);
  if (!Number.isInteger(noteId)) return bad(res, 400, 'Invalid note id.');
  const access = await getNoteAccess(noteId, getUserId(req));
  if (!access) return bad(res, 404, 'Note not found.');

  let shareCount = 0;
  let editShareCount = 0;
  if (access.role === 'owner') {
    const [[row]] = await pool.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(permission = 'edit'), 0) AS edits FROM note_shares WHERE note_id = ?`,
      [noteId]
    );
    shareCount = Number(row.total);
    editShareCount = Number(row.edits);
  }
  res.json({
    success: true,
    meta: {
      id: noteId,
      role: access.role,
      is_locked: access.locked,
      share_count: shareCount,
      edit_share_count: editShareCount,
      // live collaboration is used when somebody else can edit this note
      collab: access.role !== 'owner' || editShareCount > 0,
    },
  });
}));

// Owner: list recipients -------------------------------------------------------------
router.get('/notes/:id/shares', noteLockGuard, asyncHandler(async (req, res) => {
  const access = requireOwner(req, res);
  if (!access) return;
  const [rows] = await pool.query(
    `SELECT s.id, s.shared_with_user_id AS user_id, u.email, u.display_name, s.permission, s.shared_at
       FROM note_shares s JOIN users u ON u.id = s.shared_with_user_id
      WHERE s.note_id = ? ORDER BY s.shared_at DESC`,
    [access.note.id]
  );
  res.json({ success: true, shares: rows });
}));

// Owner: share with one or more registered e-mail addresses ----------------------------
router.post('/notes/:id/shares', noteLockGuard, asyncHandler(async (req, res) => {
  const access = requireOwner(req, res);
  if (!access) return;

  const body = req.body || {};
  const permission = body.permission;
  if (!PERMISSIONS.includes(permission)) return bad(res, 400, 'Permission must be "read" or "edit".');
  const rawEmails = Array.isArray(body.emails) ? body.emails : body.email ? [body.email] : [];
  const emails = [...new Set(rawEmails.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
  if (emails.length === 0) return bad(res, 400, 'Enter at least one e-mail address.');
  if (emails.length > MAX_RECIPIENTS) return bad(res, 400, `You can share with at most ${MAX_RECIPIENTS} people at once.`);

  const ownerId = getUserId(req);
  const errors = [];
  const valid = [];
  for (const email of emails) {
    if (!EMAIL_RE.test(email)) errors.push({ email, reason: 'Invalid e-mail address.' });
    else valid.push(email);
  }

  let users = [];
  if (valid.length) {
    [users] = await pool.query('SELECT id, email, display_name FROM users WHERE LOWER(email) IN (?)', [valid]);
  }
  const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
  const shared = [];
  for (const email of valid) {
    const user = byEmail.get(email);
    if (!user) errors.push({ email, reason: 'No registered account with this e-mail.' });
    else if (Number(user.id) === Number(ownerId)) errors.push({ email, reason: 'You cannot share a note with yourself.' });
    else shared.push(user);
  }
  if (shared.length === 0) return bad(res, 400, 'Nothing was shared.', { errors });

  for (const user of shared) {
    await pool.query(
      `INSERT INTO note_shares (note_id, shared_with_user_id, permission) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE permission = VALUES(permission)`,
      [access.note.id, user.id, permission]
    );
  }
  realtime.onShareChanged(access.note.id);

  // e-mail notification (best effort, never blocks the response)
  const [[owner]] = await pool.query('SELECT display_name, email FROM users WHERE id = ?', [ownerId]);
  const base = process.env.CLIENT_URL || req.get('origin') || '';
  const link = base ? `${base.replace(/\/+$/, '')}/shared` : '';
  shared.forEach((user) =>
    sendShareNotification({
      to: user.email,
      ownerName: owner.display_name || owner.email,
      noteTitle: access.note.title,
      permission,
      link,
    })
  );

  res.json({
    success: true,
    shared: shared.map((u) => ({ user_id: u.id, email: u.email, display_name: u.display_name, permission })),
    errors,
  });
}));

// Owner: change permission -------------------------------------------------------------
router.put('/notes/:id/shares/:shareId', noteLockGuard, asyncHandler(async (req, res) => {
  const access = requireOwner(req, res);
  if (!access) return;
  const { permission } = req.body || {};
  if (!PERMISSIONS.includes(permission)) return bad(res, 400, 'Permission must be "read" or "edit".');
  const [result] = await pool.query('UPDATE note_shares SET permission = ? WHERE id = ? AND note_id = ?', [
    permission,
    parseInt(req.params.shareId, 10),
    access.note.id,
  ]);
  if (!result.affectedRows) return bad(res, 404, 'Share not found.');
  realtime.onShareChanged(access.note.id);
  res.json({ success: true });
}));

// Owner: revoke ---------------------------------------------------------------------------
router.delete('/notes/:id/shares/:shareId', noteLockGuard, asyncHandler(async (req, res) => {
  const access = requireOwner(req, res);
  if (!access) return;
  const [result] = await pool.query('DELETE FROM note_shares WHERE id = ? AND note_id = ?', [
    parseInt(req.params.shareId, 10),
    access.note.id,
  ]);
  if (!result.affectedRows) return bad(res, 404, 'Share not found.');
  realtime.onShareChanged(access.note.id);
  res.json({ success: true });
}));

// Recipient: everything shared with me -----------------------------------------------------
router.get('/shared-notes', authenticate, asyncHandler(async (req, res) => {
  const params = [getUserId(req)];
  let sinceSql = '';
  if (req.query.since) {
    const since = new Date(String(req.query.since));
    if (!Number.isNaN(since.getTime())) {
      sinceSql = 'AND s.shared_at > ?';
      params.push(since);
    }
  }
  const [rows] = await pool.query(
    `SELECT n.id, n.title, n.is_locked, n.updated_at,
            CASE WHEN n.is_locked = 1 THEN NULL ELSE LEFT(n.content, 300) END AS snippet,
            s.id AS share_id, s.permission, s.shared_at,
            u.id AS owner_id, u.email AS owner_email, u.display_name AS owner_name, u.avatar_url AS owner_avatar
       FROM note_shares s
       JOIN notes n ON n.id = s.note_id
       JOIN users u ON u.id = n.user_id
      WHERE s.shared_with_user_id = ? ${sinceSql}
      ORDER BY s.shared_at DESC`,
    params
  );
  res.json({ success: true, count: rows.length, notes: rows });
}));

// Recipient: open one shared note (content) -----------------------------------------------
router.get('/shared-notes/:id', noteLockGuard, asyncHandler(async (req, res) => {
  const access = req.noteAccess;
  if (!access) return bad(res, 404, 'Note not found.');
  const [[note]] = await pool.query(
    `SELECT n.id, n.title, n.content, n.is_locked, n.created_at, n.updated_at,
            u.id AS owner_id, u.email AS owner_email, u.display_name AS owner_name
       FROM notes n JOIN users u ON u.id = n.user_id WHERE n.id = ?`,
    [access.note.id]
  );
  res.json({
    success: true,
    note,
    permission: access.role, // 'owner' | 'edit' | 'read'
    shared_at: access.note.shared_at || null,
  });
}));

module.exports = router;
