const jwt = require('jsonwebtoken');
const { NoteError, positiveId } = require('./validation');

function jwtSecret(req) {
  const secret = req.app.locals.notesJwtSecret || process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret.startsWith('super_secret_jwt_key')) {
    throw new NoteError(503, 'AUTH_NOT_CONFIGURED', 'Máy chủ chưa được cấu hình xác thực an toàn.');
  }
  return secret;
}

async function requireNoteAuth(req, res, next) {
  try {
    // A trusted TV1 middleware may supply req.auth.userId instead of this JWT adapter.
    const supplied = req.auth?.userId;
    if (supplied) {
      req.noteUserId = positiveId(supplied);
      return next();
    }
    const token = /^Bearer (\S+)$/.exec(req.headers.authorization || '')?.[1];
    if (!token) throw new NoteError(401, 'AUTH_REQUIRED', 'Vui lòng đăng nhập.');
    let claims;
    try {
      claims = jwt.verify(token, jwtSecret(req), { algorithms: ['HS256'] });
    } catch (error) {
      if (error instanceof NoteError) throw error;
      throw new NoteError(401, 'AUTH_REQUIRED', 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }
    const id = positiveId(claims.id ?? claims.user_id ?? claims.sub);
    const [users] = await req.app.locals.notesPool.execute('SELECT id FROM users WHERE id = ?', [id]);
    if (!users.length) throw new NoteError(401, 'AUTH_REQUIRED', 'Tài khoản không còn tồn tại.');
    req.noteUserId = id;
    next();
  } catch (error) {
    next(error);
  }
}

async function getAccess(db, req, id, action = 'read', lock = false) {
  const [rows] = await db.execute(
    `SELECT n.*, s.permission,
       EXISTS(SELECT 1 FROM note_shares x WHERE x.note_id = n.id) AS is_shared
     FROM notes n LEFT JOIN note_shares s ON s.note_id = n.id AND s.shared_with_user_id = ?
     WHERE n.id = ? AND (n.user_id = ? OR s.id IS NOT NULL) ${lock ? 'FOR UPDATE' : ''}`,
    [req.noteUserId, id, req.noteUserId],
  );
  const note = rows[0];
  if (!note) throw new NoteError(404, 'NOT_FOUND', 'Không tìm thấy ghi chú.');
  note.actor_id = req.noteUserId;
  const owner = note.user_id === req.noteUserId;
  const manages = ['delete', 'pin', 'labels'].includes(action);
  if ((manages && !owner) || (action !== 'read' && !owner && note.permission !== 'edit')) {
    throw new NoteError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.');
  }
  if (note.is_locked || note.password_hash) {
    // Fail closed until TV3 provides its server-side password-grant verifier.
    const authorize = req.app.locals.noteSecurity?.authorizeLockedNote;
    const allowed = authorize && await authorize({ req, db, noteId: id, action, userId: req.noteUserId });
    if (!allowed) throw new NoteError(423, 'NOTE_LOCKED', 'Ghi chú đang khóa. Vui lòng mở khóa trước khi tiếp tục.');
  }
  return note;
}

module.exports = { requireNoteAuth, getAccess, jwtSecret };
