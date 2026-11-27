const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const enabled = Boolean(process.env.NOTES_TEST_DB_CONFIG);
const secret = crypto.randomBytes(48).toString('hex');
let pool, server, origin, config, storage;
let id, version;

before(async () => {
  if (!enabled) return;
  config = JSON.parse(await fs.readFile(process.env.NOTES_TEST_DB_CONFIG, 'utf8'));
  if (!/^note_tv2_test[a-z0-9_]*$/.test(config.database) || config.disposable !== true) {
    throw new Error('Only disposable note_tv2_test* databases are allowed.');
  }
  const { disposable, ...connectionConfig } = config;
  const connection = await mysql.createConnection({ ...connectionConfig, database: undefined, multipleStatements: true });
  const folder = path.resolve(__dirname, '../../../../../database');
  for (const file of ['schema.sql', 'seed.sql', 'migrations/001_member2_notes.sql']) {
    const sql = (await fs.readFile(path.join(folder, file), 'utf8')).replaceAll('`note_app_db`', mysql.escapeId(config.database));
    await connection.query(sql);
  }
  await connection.end();
  pool = mysql.createPool({ ...connectionConfig, timezone: 'Z', connectionLimit: 5 });
  pool.pool.on('connection', current => current.query("SET time_zone = '+00:00'"));
  storage = await fs.mkdtemp(path.join(os.tmpdir(), 'note-tv2-files-'));
  process.env.UPLOAD_DIR = storage;
  const { installNotes } = require('../install');
  const app = express();
  app.use(express.json());
  app.locals.notesJwtSecret = secret;
  installNotes(app, pool);
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  if (pool) { await pool.query(`DROP DATABASE ${mysql.escapeId(config.database)}`); await pool.end(); }
  if (storage) await fs.rm(storage, { recursive: true, force: true });
});

async function request(method, url, body, user = 1, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  if (user) headers.Authorization = `Bearer ${jwt.sign({ id: user }, secret, { expiresIn: '5m', algorithm: 'HS256' })}`;
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(origin + url, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.arrayBuffer();
  return { status: response.status, data, headers: response.headers };
}

function dbTest(name, run) { test(name, { skip: !enabled }, run); }

dbTest('DB/API: anonymous access rejected; locked list/search/detail do not leak content', async () => {
  assert.equal((await request('GET', '/api/notes', null, null)).status, 401);
  const all = await request('GET', '/api/notes');
  assert.equal(all.status, 200);
  const locked = all.data.data.items.find(note => note.id === 3);
  assert.equal(locked.content_preview, null);
  assert.ok(!('password_hash' in locked));
  assert.equal((await request('GET', '/api/notes/3')).status, 423);
  assert.equal((await request('GET', '/api/notes?q=private%20credentials')).data.data.items.length, 0);
  assert.equal((await request('GET', '/api/notes/2', null, 2)).status, 404);
});

dbTest('DB/API: create is idempotent, empty input rejected, same key/different body rejected', async () => {
  assert.equal((await request('POST', '/api/notes', { title: '', content: 'x', operation_id: crypto.randomUUID() })).status, 422);
  const body = { title: 'Core test', content: 'OnlyContentKeyword', operation_id: crypto.randomUUID() };
  const first = await request('POST', '/api/notes', body);
  assert.equal(first.status, 201, JSON.stringify(first.data));
  id = first.data.data.note.id;
  version = first.data.data.note.version;
  const again = await request('POST', '/api/notes', body);
  assert.equal(again.status, 200);
  assert.equal(again.data.data.note.id, id);
  assert.equal((await request('POST', '/api/notes', { ...body, title: 'Different' })).status, 409);
  assert.equal((await request('GET', '/api/notes?q=OnlyContentKeyword')).data.data.items.length, 1);
});

dbTest('DB/API: parallel writes serialize; stale versions conflict and retries do not write again', async () => {
  const a = { title: 'First writer', content: 'Text A', base_version: version, operation_id: crypto.randomUUID() };
  const b = { title: 'Second writer', content: 'Text B', base_version: version, operation_id: crypto.randomUUID() };
  const results = await Promise.all([request('PATCH', `/api/notes/${id}`, a), request('PATCH', `/api/notes/${id}`, b)]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409], JSON.stringify(results));
  const winner = results[0].status === 200 ? a : b;
  const retry = await request('PATCH', `/api/notes/${id}`, winner);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.data.mutation.replayed, true);
  version = retry.data.data.note.version;
  assert.equal(version, 2);
});

dbTest('DB/API: pin time is stable through edits and last-pinned note sorts first', async () => {
  const pin = await request('PUT', `/api/notes/${id}/pin`, { pinned: true, base_version: version, operation_id: crypto.randomUUID() });
  assert.equal(pin.status, 200);
  assert.equal(pin.data.data.note.is_pinned, true, JSON.stringify(pin.data));
  version = pin.data.data.note.version;
  const pinnedAt = pin.data.data.note.pinned_at;
  const edited = await request('PATCH', `/api/notes/${id}`, { title: 'Pinned edited', content: 'Body', base_version: version, operation_id: crypto.randomUUID() });
  assert.equal(edited.data.data.note.pinned_at, pinnedAt);
  version = edited.data.data.note.version;
  const list = (await request('GET', '/api/notes')).data.data.items;
  assert.equal(list[0].id, id, JSON.stringify(list.map(note => ({ id: note.id, pinned_at: note.pinned_at }))));
});

dbTest('DB/API: label OR filter has no duplicates; rename propagates; delete preserves notes', async () => {
  const a = (await request('POST', '/api/labels', { name: 'Test label A' })).data.data.label;
  const b = (await request('POST', '/api/labels', { name: 'Test label B' })).data.data.label;
  const foreign = (await request('POST', '/api/labels', { name: 'Foreign label' }, 2)).data.data.label;
  assert.equal((await request('PUT', `/api/notes/${id}/labels`, { label_ids: [foreign.id], base_version: version, operation_id: crypto.randomUUID() })).status, 422);
  const attached = await request('PUT', `/api/notes/${id}/labels`, { label_ids: [a.id, b.id], base_version: version, operation_id: crypto.randomUUID() });
  version = attached.data.data.note.version;
  const filtered = await request('GET', `/api/notes?label_ids=${a.id},${b.id}`);
  assert.equal(filtered.data.data.items.length, 1);
  assert.equal(filtered.data.data.meta.total, 1);
  await request('PATCH', `/api/labels/${a.id}`, { name: 'Renamed' });
  assert.equal((await request('GET', `/api/notes/${id}`)).data.data.note.labels.find(label => label.id === a.id).name, 'Renamed');
  assert.equal((await request('DELETE', `/api/labels/${a.id}`)).status, 204);
  assert.equal((await request('GET', `/api/notes/${id}`)).status, 200);
});

dbTest('DB/API: read-only share cannot write; edit cannot delete; revocation applies immediately', async () => {
  await pool.execute('INSERT INTO note_shares (note_id, shared_with_user_id, permission) VALUES (?, 2, ?)', [id, 'read']);
  assert.equal((await request('GET', `/api/notes/${id}`, null, 2)).status, 200);
  assert.equal((await request('PATCH', `/api/notes/${id}`, { title: 'Hack', content: 'x', base_version: version, operation_id: crypto.randomUUID() }, 2)).status, 403);
  await pool.execute("UPDATE note_shares SET permission = 'edit' WHERE note_id = ? AND shared_with_user_id = 2", [id]);
  assert.equal((await request('DELETE', `/api/notes/${id}`, { base_version: version, operation_id: crypto.randomUUID() }, 2)).status, 403);
  await pool.execute('DELETE FROM note_shares WHERE note_id = ? AND shared_with_user_id = 2', [id]);
  assert.equal((await request('GET', `/api/notes/${id}`, null, 2)).status, 404);
});

dbTest('DB/API: attachment types, private access, Range, replay and deletion', async () => {
  const fake = new FormData();
  fake.append('operation_id', crypto.randomUUID()); fake.append('base_version', version);
  fake.append('files', new Blob(['<html>not a png</html>'], { type: 'image/png' }), 'fake.png');
  assert.equal((await request('POST', `/api/notes/${id}/attachments`, fake)).status, 415);
  const form = new FormData();
  form.append('operation_id', crypto.randomUUID()); form.append('base_version', version);
  form.append('files', new Blob(['hello private file'], { type: 'text/plain' }), 'sample.txt');
  const uploaded = await request('POST', `/api/notes/${id}/attachments`, form);
  assert.equal(uploaded.status, 201, JSON.stringify(uploaded.data));
  version = uploaded.data.data.note.version;
  const file = uploaded.data.data.note.attachments[0];
  const replay = await request('POST', `/api/notes/${id}/attachments`, form);
  assert.equal(replay.status, 200);
  assert.equal(replay.data.data.note.attachments.length, 1);
  const download = await request('GET', file.content_url, null, 1, { Range: 'bytes=0-4' });
  assert.equal(download.status, 206);
  assert.equal(Buffer.from(download.data).toString(), 'hello');
  assert.equal(download.headers.get('cache-control'), 'private, no-store');
  assert.equal((await request('GET', file.content_url, null, 2)).status, 404);
  assert.equal((await request('HEAD', file.content_url, null, 1, { Range: 'bytes=999-' })).status, 416);
  const removed = await request('DELETE', `/api/notes/${id}/attachments/${file.id}`, { base_version: version, operation_id: crypto.randomUUID() });
  assert.equal(removed.status, 200);
  version = removed.data.data.note.version;
  assert.equal((await request('GET', file.content_url)).status, 404);
});

dbTest('DB/API: deletion is owner-only and a lost ACK can be replayed after the row is gone', async () => {
  const body = { base_version: version, operation_id: crypto.randomUUID() };
  assert.equal((await request('DELETE', `/api/notes/${id}`, body)).status, 204);
  assert.equal((await request('DELETE', `/api/notes/${id}`, body)).status, 204);
  assert.equal((await request('GET', `/api/notes/${id}`)).status, 404);
});
