const { NoteError, serializeNote } = require('./validation');
const { getAccess } = require('./access');

async function transaction(pool, work) {
  const db = await pool.getConnection();
  try {
    await db.query('SET TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await db.beginTransaction();
    const result = await work(db);
    await db.commit();
    return result;
  } catch (error) {
    await db.rollback();
    throw error;
  } finally {
    db.release();
  }
}

async function readReceipt(db, userId, operation, hash) {
  const [rows] = await db.execute('SELECT * FROM note_mutations WHERE user_id = ? AND operation_id = ?', [userId, operation]);
  const receipt = rows[0];
  if (receipt && receipt.request_hash !== hash) {
    throw new NoteError(409, 'OPERATION_REUSED', 'Mã thao tác đã dùng cho một yêu cầu khác.');
  }
  if (receipt && typeof receipt.result_json === 'string') receipt.result_json = JSON.parse(receipt.result_json);
  return receipt;
}

async function writeReceipt(db, userId, operation, hash, noteId, version, result = {}) {
  await db.execute(
    'INSERT INTO note_mutations (user_id, operation_id, request_hash, note_id, applied_version, result_json) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, operation, hash, noteId, version, JSON.stringify(result)],
  );
}

async function ownedLabels(db, userId, ids) {
  if (!ids.length) return;
  const marks = ids.map(() => '?').join(',');
  const [rows] = await db.execute(`SELECT id FROM labels WHERE user_id = ? AND id IN (${marks})`, [userId, ...ids]);
  if (rows.length !== ids.length) throw new NoteError(422, 'INVALID_LABELS', 'Một hoặc nhiều nhãn không thuộc tài khoản của bạn.');
}

async function labelsFor(db, noteIds, ownerId) {
  if (!noteIds.length) return [];
  const marks = noteIds.map(() => '?').join(',');
  const [rows] = await db.execute(
    `SELECT nl.note_id, l.id, l.name FROM note_labels nl JOIN labels l ON l.id = nl.label_id
     WHERE l.user_id = ? AND nl.note_id IN (${marks}) ORDER BY l.name, l.id`,
    [ownerId, ...noteIds],
  );
  return rows;
}

function attachmentDto(row) {
  return {
    id: row.id, note_id: row.note_id, original_name: row.original_name,
    file_type: row.file_type, file_size: row.file_size,
    media_kind: row.file_type.startsWith('image/') ? 'image' : row.file_type.startsWith('video/') ? 'video' : 'file',
    content_url: `/api/notes/${row.note_id}/attachments/${row.id}/content`,
  };
}

async function detail(db, req, noteId) {
  const row = await getAccess(db, req, noteId);
  const labels = await labelsFor(db, [noteId], req.noteUserId);
  const [files] = await db.execute('SELECT * FROM attachments WHERE note_id = ? ORDER BY id', [noteId]);
  const result = serializeNote(row, labels.map(({ id, name }) => ({ id, name })), true);
  result.attachments = files.map(attachmentDto);
  return result;
}

function assertVersion(note, baseVersion) {
  if (!Number.isSafeInteger(Number(baseVersion)) || Number(baseVersion) < 1) {
    throw new NoteError(422, 'INVALID_VERSION', 'base_version bắt buộc là số nguyên dương.');
  }
  if (note.version !== Number(baseVersion)) {
    throw new NoteError(409, 'VERSION_CONFLICT', 'Ghi chú đã thay đổi. Hãy kiểm tra hai bản trước khi tiếp tục.', { current_version: note.version });
  }
}

function publish(req, noteId, version, operationId, kind) {
  // Socket/offline modules subscribe here; failures cannot undo an already committed save.
  Promise.resolve().then(() => req.app.locals.noteEvents?.publishNoteChange?.({
    noteId, version, operationId, kind, actorId: req.noteUserId,
  })).catch(() => console.error('NOTE_EVENT_DELIVERY_FAILED'));
}

module.exports = { transaction, readReceipt, writeReceipt, ownedLabels, labelsFor, detail, assertVersion, publish, attachmentDto };
