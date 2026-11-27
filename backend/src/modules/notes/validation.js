const crypto = require('node:crypto');

class NoteError extends Error {
  constructor(status, code, message, details) {
    super(message);
    Object.assign(this, { status, code, details });
  }
}

function positiveId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new NoteError(400, 'INVALID_ID', 'ID phải là số nguyên dương.');
  }
  return id;
}

function text(value, name, max) {
  if (typeof value !== 'string' || !value.trim() || [...value].length > max) {
    throw new NoteError(422, 'VALIDATION_ERROR', `${name} bắt buộc và tối đa ${max} ký tự.`);
  }
  return value;
}

function noteText(body) {
  return { title: text(body.title, 'Tiêu đề', 200).trim(), content: text(body.content, 'Nội dung', 20000) };
}

function operationId(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new NoteError(422, 'INVALID_OPERATION', 'operation_id phải là UUID v4.');
  }
  return value.toLowerCase();
}

function labelIds(value) {
  if (!Array.isArray(value) || value.length > 20) {
    throw new NoteError(422, 'INVALID_LABELS', 'Chọn tối đa 20 nhãn.');
  }
  return [...new Set(value.map(positiveId))];
}

function escapeLike(value) {
  return value.replace(/[!%_]/g, '!$&');
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

function requestHash(req, secret, payload = req.body) {
  const input = JSON.stringify(canonical({ method: req.method, path: req.originalUrl.split('?')[0], body: payload }));
  return crypto.createHmac('sha256', secret).update(input).digest('hex');
}

function serializeNote(row, labels = [], detail = false) {
  const locked = Boolean(row.is_locked || row.password_hash);
  const owner = row.actor_id === row.user_id;
  const role = owner ? 'owner' : row.permission === 'edit' ? 'editor' : 'reader';
  const result = {
    id: row.id, user_id: row.user_id, title: row.title,
    is_locked: locked, is_shared: Boolean(row.is_shared),
    is_pinned: Boolean(row.pinned_at), pinned_at: row.pinned_at,
    version: row.version, content_version: row.content_version,
    created_at: row.created_at, updated_at: row.updated_at,
    content_preview: locked ? null : (row.content || '').slice(0, 160),
    labels: owner && !locked ? labels : [],
    access: { role, can_edit: role !== 'reader', can_manage: owner },
  };
  if (detail) result.content = row.content;
  return result;
}

module.exports = { NoteError, positiveId, text, noteText, operationId, labelIds, escapeLike, requestHash, serializeNote };
