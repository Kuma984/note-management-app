const express = require('express');
const { requireNoteAuth, getAccess, jwtSecret } = require('./access');
const { NoteError, positiveId, noteText, operationId, labelIds, escapeLike, requestHash, serializeNote } = require('./validation');
const { transaction, readReceipt, writeReceipt, ownedLabels, labelsFor, detail, assertVersion, publish } = require('./repository');
const { installAttachments, removeStoredFiles } = require('./attachments');

function pool(req) { return req.app.locals.notesPool; }

async function mutate(req, action, kind, work) {
  const id = positiveId(req.params.id);
  const operation = operationId(req.body.operation_id);
  const hash = requestHash(req, jwtSecret(req));
  const result = await transaction(pool(req), async db => {
    const previous = await readReceipt(db, req.noteUserId, operation, hash);
    if (previous) {
      if (previous.result_json.deleted) return { id, deleted: true, replayed: true, version: previous.applied_version };
      await getAccess(db, req, id, action);
      return { id, replayed: true, version: previous.applied_version };
    }
    const note = await getAccess(db, req, id, action, true);
    // Recheck after acquiring the note lock: a parallel retry may have just committed.
    const concurrent = await readReceipt(db, req.noteUserId, operation, hash);
    if (concurrent) return { id, replayed: true, version: concurrent.applied_version };
    assertVersion(note, req.body.base_version);
    const extra = await work(db, note);
    const version = note.version + 1;
    if (!extra?.deleted) {
      await db.execute('UPDATE notes SET version = ?, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [version, id]);
    }
    await writeReceipt(db, req.noteUserId, operation, hash, id, version, { deleted: Boolean(extra?.deleted) });
    return { id, version, ...extra };
  });
  if (!result.replayed) publish(req, id, result.version, operation, kind);
  if (result.deleted) return result;
  return { note: await detail(pool(req), req, id), mutation: { operation_id: operation, applied_version: result.version, replayed: Boolean(result.replayed) } };
}

function createNotesRouter() {
  const router = express.Router();
  router.use(requireNoteAuth);
  router.use((req, res, next) => { req.body ||= {}; next(); });

  router.get('/', async (req, res) => {
    const page = positiveId(req.query.page ?? 1);
    const limit = Math.min(positiveId(req.query.limit ?? 20), 100);
    const q = String(req.query.q ?? '').trim();
    if (q.length > 200) throw new NoteError(422, 'INVALID_SEARCH', 'Từ khóa tối đa 200 ký tự.');
    const ids = req.query.label_ids ? labelIds(String(req.query.label_ids).split(',')) : [];
    await ownedLabels(pool(req), req.noteUserId, ids);
    const conditions = ['n.user_id = ?'];
    const values = [req.noteUserId];
    if (q) {
      conditions.push("(n.title LIKE ? ESCAPE '!' OR ((n.is_locked = 0 AND n.password_hash IS NULL) AND n.content LIKE ? ESCAPE '!'))");
      const search = `%${escapeLike(q)}%`;
      values.push(search, search);
    }
    if (ids.length) {
      conditions.push(`EXISTS(SELECT 1 FROM note_labels nl WHERE nl.note_id = n.id AND nl.label_id IN (${ids.map(() => '?').join(',')}))`);
      values.push(...ids);
    }
    const where = conditions.join(' AND ');
    const [[count]] = await pool(req).execute(`SELECT COUNT(*) AS total FROM notes n WHERE ${where}`, values);
    // Integers below are validated, not raw query-string interpolation.
    const [rows] = await pool(req).execute(
      `SELECT n.*, EXISTS(SELECT 1 FROM note_shares s WHERE s.note_id = n.id) AS is_shared
       FROM notes n WHERE ${where}
       ORDER BY (n.pinned_at IS NOT NULL) DESC, n.pinned_at DESC, n.updated_at DESC, n.id DESC
       LIMIT ${limit} OFFSET ${(page - 1) * limit}`, values,
    );
    const labels = await labelsFor(pool(req), rows.filter(n => !n.is_locked && !n.password_hash).map(n => n.id), req.noteUserId);
    const items = rows.map(row => serializeNote({ ...row, actor_id: req.noteUserId }, labels.filter(l => l.note_id === row.id).map(({ id, name }) => ({ id, name }))));
    res.json({ data: { items, meta: { page, limit, total: count.total, has_more: page * limit < count.total } } });
  });

  router.post('/', async (req, res) => {
    const input = noteText(req.body);
    const operation = operationId(req.body.operation_id);
    const hash = requestHash(req, jwtSecret(req));
    let result;
    try {
      result = await transaction(pool(req), async db => {
        const receipt = await readReceipt(db, req.noteUserId, operation, hash);
        if (receipt) return { id: receipt.note_id, replayed: true, version: receipt.applied_version };
        const [insert] = await db.execute('INSERT INTO notes (user_id, title, content, client_id) VALUES (?, ?, ?, ?)', [req.noteUserId, input.title, input.content, operation]);
        await writeReceipt(db, req.noteUserId, operation, hash, insert.insertId, 1);
        return { id: insert.insertId, version: 1 };
      });
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') throw error;
      const receipt = await readReceipt(pool(req), req.noteUserId, operation, hash);
      if (!receipt) throw new NoteError(409, 'OPERATION_REUSED', 'Không thể tạo lại thao tác này.');
      result = { id: receipt.note_id, replayed: true, version: receipt.applied_version };
    }
    res.status(result.replayed ? 200 : 201).json({ data: {
      note: await detail(pool(req), req, result.id),
      mutation: { operation_id: operation, applied_version: result.version, replayed: Boolean(result.replayed) },
    } });
    if (!result.replayed) publish(req, result.id, 1, operation, 'created');
  });

  router.get('/:id', async (req, res) => {
    res.json({ data: { note: await detail(pool(req), req, positiveId(req.params.id)) } });
  });

  router.patch('/:id', async (req, res) => {
    const input = noteText(req.body);
    res.json({ data: await mutate(req, 'edit', 'content', async db => {
      await db.execute('UPDATE notes SET title = ?, content = ?, content_version = content_version + 1 WHERE id = ?', [input.title, input.content, positiveId(req.params.id)]);
    }) });
  });

  router.delete('/:id', async (req, res) => {
    const result = await mutate(req, 'delete', 'deleted', async (db, note) => {
      const [files] = await db.execute('SELECT file_path FROM attachments WHERE note_id = ?', [note.id]);
      await db.execute('DELETE FROM notes WHERE id = ?', [note.id]);
      return { deleted: true, files };
    });
    await removeStoredFiles(result.files || []);
    res.status(204).end();
  });

  router.put('/:id/pin', async (req, res) => {
    if (typeof req.body.pinned !== 'boolean') throw new NoteError(422, 'INVALID_PIN', 'pinned phải là boolean.');
    res.json({ data: await mutate(req, 'pin', 'pin', async (db, note) => {
      await db.execute('UPDATE notes SET is_pinned = ?, pinned_at = CASE WHEN ? THEN COALESCE(pinned_at, UTC_TIMESTAMP(6)) ELSE NULL END WHERE id = ?', [req.body.pinned, req.body.pinned, note.id]);
    }) });
  });

  router.put('/:id/labels', async (req, res) => {
    const ids = labelIds(req.body.label_ids);
    res.json({ data: await mutate(req, 'labels', 'labels', async (db, note) => {
      await ownedLabels(db, req.noteUserId, ids);
      await db.execute('DELETE FROM note_labels WHERE note_id = ?', [note.id]);
      for (const id of ids) await db.execute('INSERT INTO note_labels (note_id, label_id) VALUES (?, ?)', [note.id, id]);
    }) });
  });

  installAttachments(router, mutate);
  return router;
}

function notesErrorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const uploadError = error.code?.startsWith('LIMIT_');
  const duplicate = error.code === 'ER_DUP_ENTRY';
  const status = error.status || (uploadError ? 413 : duplicate ? 409 : 500);
  const code = uploadError ? 'UPLOAD_LIMIT' : duplicate ? 'DUPLICATE' : error.code || 'INTERNAL_ERROR';
  const message = error.status ? error.message : uploadError ? 'File quá lớn hoặc vượt số lượng cho phép.' : duplicate ? 'Dữ liệu đã tồn tại.' : 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
  if (status >= 500) console.error('NOTES_REQUEST_FAILED', { code: error.code || error.name });
  res.status(status).json({ error: { code, message, ...(error.details ? { details: error.details } : {}) } });
}

module.exports = { createNotesRouter, notesErrorHandler };
