const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const { NoteError, positiveId, operationId, requestHash } = require('./validation');
const { getAccess, jwtSecret } = require('./access');
const { transaction, readReceipt, writeReceipt, assertVersion, detail, publish } = require('./repository');

const ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads'));
const TEMP = path.join(ROOT, '.incoming');
const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf', '.txt': 'text/plain',
};

function storedPath(key) {
  // Never use a client-provided path. Old unsafe paths fail closed as well.
  if (typeof key !== 'string' || !/^notes\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|mp4|webm|pdf|txt)$/.test(key)) {
    throw new NoteError(404, 'FILE_NOT_FOUND', 'Không tìm thấy tệp.');
  }
  return path.join(ROOT, key);
}

async function removeStoredFiles(files) {
  for (const file of files) {
    try { await fsp.unlink(storedPath(file.file_path)); }
    catch (error) { if (error.code !== 'ENOENT') console.error('ATTACHMENT_CLEANUP_FAILED'); }
  }
}

function matchesType(bytes, mime) {
  if (mime === 'image/jpeg') return bytes.length > 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === 'image/webp') return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (mime === 'video/mp4') return bytes.length >= 12 && bytes.toString('ascii', 4, 8) === 'ftyp';
  if (mime === 'video/webm') return bytes.subarray(0, 4).equals(Buffer.from([26, 69, 223, 163]));
  if (mime === 'application/pdf') return bytes.toString('ascii', 0, 5) === '%PDF-';
  if (mime === 'text/plain') {
    try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); return !bytes.includes(0); }
    catch { return false; }
  }
  return false;
}

function rangeFor(header, size) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return false;
  let start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  let end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) return false;
  return { start, end };
}

function installAttachments(router, mutate) {
  const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, callback) { fsp.mkdir(TEMP, { recursive: true }).then(() => callback(null, TEMP), callback); },
      filename(req, file, callback) { callback(null, crypto.randomUUID()); },
    }),
    limits: { fileSize: MAX_BYTES, files: 5, fields: 2, fieldSize: 200 },
  }).array('files', 5);

  router.post('/:id/attachments', async (req, res) => {
    const id = positiveId(req.params.id);
    await getAccess(req.app.locals.notesPool, req, id, 'upload');
    await new Promise((resolve, reject) => upload(req, res, error => error ? reject(error) : resolve()));
    const temporary = req.files || [];
    const moved = [];
    let committed = false;
    try {
      if (!temporary.length) throw new NoteError(422, 'NO_FILES', 'Chọn ít nhất một tệp.');
      const manifest = [];
      for (const file of temporary) {
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = TYPES[ext];
        const bytes = await fsp.readFile(file.path);
        if (!bytes.length || !mime || file.mimetype !== mime || !matchesType(bytes, mime)) {
          throw new NoteError(415, 'INVALID_FILE_TYPE', 'Chỉ nhận JPEG, PNG, WebP, MP4, WebM, PDF và TXT đúng định dạng.');
        }
        const name = path.basename(file.originalname).replace(/[\x00-\x1f\x7f]/g, '').slice(0, 200);
        manifest.push({ file, ext, mime, name, digest: crypto.createHash('sha256').update(bytes).digest('hex') });
      }
      const operation = operationId(req.body.operation_id);
      const hash = requestHash(req, jwtSecret(req), {
        ...req.body, files: manifest.map(x => ({ name: x.name, mime: x.mime, digest: x.digest })),
      });
      const result = await transaction(req.app.locals.notesPool, async db => {
        const note = await getAccess(db, req, id, 'upload', true);
        const previous = await readReceipt(db, req.noteUserId, operation, hash);
        if (previous) return { version: previous.applied_version, replayed: true };
        assertVersion(note, req.body.base_version);
        const [[count]] = await db.execute('SELECT COUNT(*) AS total FROM attachments WHERE note_id = ?', [id]);
        if (count.total + manifest.length > 10) throw new NoteError(413, 'ATTACHMENT_LIMIT', 'Mỗi ghi chú tối đa 10 tệp.');
        await fsp.mkdir(path.join(ROOT, 'notes'), { recursive: true });
        for (const item of manifest) {
          const key = `notes/${crypto.randomUUID()}${item.ext}`;
          await fsp.rename(item.file.path, storedPath(key));
          moved.push({ file_path: key });
          await db.execute('INSERT INTO attachments (note_id, original_name, file_path, file_type, file_size) VALUES (?, ?, ?, ?, ?)', [id, item.name, key, item.mime, item.file.size]);
        }
        const version = note.version + 1;
        await db.execute('UPDATE notes SET version = ?, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [version, id]);
        await writeReceipt(db, req.noteUserId, operation, hash, id, version);
        return { version };
      });
      committed = true;
      if (!result.replayed) publish(req, id, result.version, operation, 'attachments');
      res.status(result.replayed ? 200 : 201).json({ data: {
        note: await detail(req.app.locals.notesPool, req, id),
        mutation: { operation_id: operation, applied_version: result.version, replayed: Boolean(result.replayed) },
      } });
    } finally {
      await Promise.all(temporary.map(file => fsp.unlink(file.path).catch(() => {})));
      if (!committed) await removeStoredFiles(moved);
    }
  });

  router.delete('/:id/attachments/:fileId', async (req, res) => {
    let removed;
    const result = await mutate(req, 'upload', 'attachments', async (db, note) => {
      const [rows] = await db.execute('SELECT * FROM attachments WHERE id = ? AND note_id = ?', [positiveId(req.params.fileId), note.id]);
      if (!rows.length) throw new NoteError(404, 'FILE_NOT_FOUND', 'Không tìm thấy tệp.');
      removed = rows[0];
      await db.execute('DELETE FROM attachments WHERE id = ? AND note_id = ?', [removed.id, note.id]);
    });
    if (removed) await removeStoredFiles([removed]);
    res.json({ data: result });
  });

  async function sendFile(req, res, next) {
    const id = positiveId(req.params.id);
    await getAccess(req.app.locals.notesPool, req, id);
    const [rows] = await req.app.locals.notesPool.execute('SELECT * FROM attachments WHERE id = ? AND note_id = ?', [positiveId(req.params.fileId), id]);
    const file = rows[0];
    if (!file) throw new NoteError(404, 'FILE_NOT_FOUND', 'Không tìm thấy tệp.');
    let stat;
    try { stat = await fsp.stat(storedPath(file.file_path)); }
    catch { throw new NoteError(404, 'FILE_NOT_FOUND', 'Tệp không còn trên máy chủ.'); }
    const range = rangeFor(req.headers.range, stat.size);
    res.set({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' });
    if (range === false) return res.status(416).set('Content-Range', `bytes */${stat.size}`).end();
    res.attachment(file.original_name).type(file.file_type);
    if (file.file_type.startsWith('image/') || file.file_type.startsWith('video/')) res.set('Content-Disposition', 'inline');
    const start = range?.start ?? 0;
    const end = range?.end ?? stat.size - 1;
    if (range) res.status(206).set('Content-Range', `bytes ${start}-${end}/${stat.size}`);
    res.set('Content-Length', String(Math.max(0, end - start + 1)));
    if (req.method === 'HEAD' || stat.size === 0) return res.end();
    const stream = fs.createReadStream(storedPath(file.file_path), { start, end });
    stream.on('error', error => res.headersSent ? res.destroy() : next(error));
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  }
  router.get('/:id/attachments/:fileId/content', sendFile);
  router.head('/:id/attachments/:fileId/content', sendFile);
}

module.exports = { installAttachments, removeStoredFiles, storedPath, matchesType, rangeFor, MAX_BYTES, TYPES };
