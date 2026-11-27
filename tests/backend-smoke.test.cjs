// Smoke test of the backend module with in-memory fakes (no MySQL / npm install needed): node tests/backend-smoke.test.cjs
const Module = require('module');
const path = require('path');
const assert = require('assert');
const ROOT = path.join(__dirname, '../backend/src');

// ---------- fakes
const routes = [];
const makeRouter = () => {
  const r = { stack: routes };
  for (const m of ['get', 'post', 'put', 'delete']) r[m] = (p, ...h) => { routes.push({ m, p, h }); return r; };
  r.use = (...a) => { a.filter((x) => x && x.stack).forEach(() => {}); return r; };
  return r;
};
const express = () => ({}); express.Router = makeRouter; express.json = () => (q, s, n) => n();

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = {
  sign: (p, secret, o) => `${b64({ ...p, exp: Date.now() + o.expiresIn * 1000 })}.${secret}`,
  verify: (t, secret) => { const [b, s] = t.split('.'); if (s !== secret) throw new Error('bad sig'); const p = JSON.parse(Buffer.from(b, 'base64url')); if (p.exp < Date.now()) throw new Error('expired'); return p; },
};
const bcrypt = { hash: async (p) => 'H:' + p, compare: async (p, h) => h === 'H:' + p };

// fake DB: users 1 (owner), 2 (recipient), note 10 (open), note 11 (locked, pw "secret1")
const db = {
  users: [{ id: 1, email: 'a@x.vn', display_name: 'A' }, { id: 2, email: 'b@x.vn', display_name: 'B' }],
  notes: [
    { id: 10, user_id: 1, title: 'Plan', content: 'Buy milk and eggs on Friday', is_locked: 0, password_hash: null },
    { id: 11, user_id: 1, title: 'Secret', content: 'bank pin 1234', is_locked: 1, password_hash: 'H:secret1' },
  ],
  shares: [],
};
let shareSeq = 1;
const pool = {
  async query(sql, p = []) {
    sql = sql.replace(/\s+/g, ' ');
    if (sql.includes('CASE WHEN n.user_id = ?')) { return [db.notes.map((n) => ({ ...n, source: n.user_id === p[0] ? 'own' : 'shared' }))]; }
    if (sql.includes('FROM notes n LEFT JOIN note_shares s')) {
      const [uid, nid] = p; const n = db.notes.find((x) => x.id === nid); if (!n) return [[]];
      const s = db.shares.find((x) => x.note_id === nid && x.user_id === uid);
      return [[{ ...n, share_permission: s?.permission ?? null, shared_at: s?.shared_at ?? null }]];
    }
    if (sql.startsWith('UPDATE notes SET password_hash = ?, is_locked = 1')) { const n = db.notes.find((x) => x.id === p[1]); n.password_hash = p[0]; n.is_locked = 1; return [{}]; }
    if (sql.startsWith('UPDATE notes SET password_hash = ? WHERE')) { db.notes.find((x) => x.id === p[1]).password_hash = p[0]; return [{}]; }
    if (sql.startsWith('UPDATE notes SET password_hash = NULL')) { const n = db.notes.find((x) => x.id === p[0]); n.password_hash = null; n.is_locked = 0; return [{}]; }
    if (sql.includes('FROM users WHERE LOWER(email) IN')) return [db.users.filter((u) => p[0].includes(u.email))];
    if (sql.startsWith('INSERT INTO note_shares')) { const [nid, uid, perm] = p; let s = db.shares.find((x) => x.note_id === nid && x.user_id === uid); if (s) s.permission = perm; else db.shares.push({ id: shareSeq++, note_id: nid, user_id: uid, permission: perm, shared_at: new Date() }); return [{}]; }
    if (sql.startsWith('SELECT display_name, email FROM users')) return [[db.users.find((u) => u.id === p[0])]];
    if (sql.includes('COUNT(*) AS total')) { const l = db.shares.filter((x) => x.note_id === p[0]); return [[{ total: l.length, edits: l.filter((x) => x.permission === 'edit').length }]]; }
    if (sql.startsWith('SELECT s.id, s.shared_with_user_id')) return [db.shares.filter((x) => x.note_id === p[0]).map((s) => ({ id: s.id, user_id: s.user_id, ...db.users.find((u) => u.id === s.user_id), permission: s.permission }))];
    if (sql.startsWith('SELECT title, content FROM notes')) return [[db.notes.find((x) => x.id === p[0])]];
    if (sql.includes('CASE WHEN n.user_id = ?')) { return [db.notes.map((n) => ({ ...n, source: n.user_id === p[0] ? 'own' : 'shared' }))]; }
    if (sql.startsWith('UPDATE note_shares SET permission')) { const s = db.shares.find((x) => x.id === p[1] && x.note_id === p[2]); if (s) s.permission = p[0]; return [{ affectedRows: s ? 1 : 0 }]; }
    if (sql.startsWith('DELETE FROM note_shares')) { const i = db.shares.findIndex((x) => x.id === p[0] && x.note_id === p[1]); if (i >= 0) db.shares.splice(i, 1); return [{ affectedRows: i >= 0 ? 1 : 0 }]; }
    throw new Error('Unhandled SQL in fake: ' + sql);
  },
};

const stubs = { express, jsonwebtoken: jwt, bcryptjs: bcrypt, nodemailer: { createTransport: () => ({ sendMail: async () => {} }) }, ws: { WebSocketServer: class {} } };
const origLoad = Module._load;
Module._load = function (req, parent, isMain) {
  if (stubs[req]) return stubs[req];
  if (req === '../../config/db') return { pool };
  return origLoad.apply(this, arguments);
};
process.env.JWT_SECRET = 'test-secret';

const advanced = require(path.join(ROOT, 'modules/advanced'));
const app = { use: () => {} };
advanced.mountRoutes(app);

// ---------- helpers
function find(method, p) { const r = routes.find((x) => x.m === method && x.p === p); assert(r, `route ${method} ${p} missing`); return r; }
async function call(method, p, { user = 1, params = {}, body = {}, headers = {}, query = {} } = {}) {
  const r = find(method, p);
  const req = { params, body, query, headers: { authorization: `Bearer ${jwt.sign({ id: user }, 'test-secret', { expiresIn: 60 })}` }, get: (h) => headers[h.toLowerCase()], method, originalUrl: p };
  let out = { status: 200 }; let done;
  const finished = new Promise((r2) => (done = r2));
  const res = { status(c) { out.status = c; return this; }, json(b) { out.body = b; done(); }, headersSent: false };
  let i = 0;
  const next = (err) => { if (err) { out = { status: 500, body: { err: String(err) } }; return done(); } const h = r.h[i++]; if (h) h(req, res, next); else done(); };
  next();
  await Promise.race([finished, new Promise((r2) => setTimeout(r2, 500))]);
  return out;
}

(async () => {
  // --- lock: enable
  let r = await call('post', '/notes/:id/lock', { params: { id: '10' }, body: { password: 'abc', confirm_password: 'abc' } });
  assert.equal(r.status, 400, 'short password rejected');
  r = await call('post', '/notes/:id/lock', { params: { id: '10' }, body: { password: 'abcdef', confirm_password: 'abcdeX' } });
  assert.equal(r.status, 400, 'mismatch rejected');
  r = await call('post', '/notes/:id/lock', { user: 2, params: { id: '10' }, body: { password: 'abcdef', confirm_password: 'abcdef' } });
  assert.equal(r.status, 404, 'stranger cannot see the note');
  r = await call('post', '/notes/:id/lock', { params: { id: '10' }, body: { password: 'abcdef', confirm_password: 'abcdef' } });
  assert.equal(r.status, 200); assert(r.body.noteToken);
  const token10 = r.body.noteToken;
  assert.equal(db.notes[0].is_locked, 1);
  r = await call('post', '/notes/:id/lock', { params: { id: '10' }, body: { password: 'abcdef', confirm_password: 'abcdef' } });
  assert.equal(r.status, 409, 'already locked');

  // --- guard
  const guard = advanced.noteLockGuard;
  const run = (headers) => new Promise((resolve) => {
    const req = { params: { id: '10' }, headers: { authorization: `Bearer ${jwt.sign({ id: 1 }, 'test-secret', { expiresIn: 60 })}` }, get: (h) => headers[h.toLowerCase()] };
    const res = { status(c) { this.c = c; return this; }, json(b) { resolve({ status: this.c, body: b }); } };
    guard(req, res, () => resolve({ status: 'next' }));
  });
  r = await run({}); assert.equal(r.status, 423); assert.equal(r.body.code, 'NOTE_LOCKED');
  r = await run({ 'x-note-token': 'garbage.x' }); assert.equal(r.status, 423);
  r = await run({ 'x-note-token': token10 }); assert.equal(r.status, 'next');

  // --- unlock
  r = await call('post', '/notes/:id/unlock', { params: { id: '10' }, body: { password: 'nope' } });
  assert.equal(r.status, 403); assert.equal(r.body.code, 'INVALID_NOTE_PASSWORD');
  r = await call('post', '/notes/:id/unlock', { params: { id: '10' }, body: { password: 'abcdef' } });
  assert.equal(r.status, 200); assert(r.body.noteToken);
  // brute force lockout (5 wrong)
  for (let i = 0; i < 5; i++) await call('post', '/notes/:id/unlock', { params: { id: '11' }, body: { password: 'bad' + i } });
  r = await call('post', '/notes/:id/unlock', { params: { id: '11' }, body: { password: 'secret1' } });
  assert.equal(r.status, 429, 'locked out after 5 wrong attempts');

  // --- change password + disable
  r = await call('put', '/notes/:id/lock/password', { params: { id: '10' }, body: { current_password: 'wrong1', new_password: 'newpass', confirm_password: 'newpass' } });
  assert.equal(r.status, 403);
  r = await call('put', '/notes/:id/lock/password', { params: { id: '10' }, body: { current_password: 'abcdef', new_password: 'newpass', confirm_password: 'newpass' } });
  assert.equal(r.status, 200); assert.equal(db.notes[0].password_hash, 'H:newpass');
  r = await call('post', '/notes/:id/lock/disable', { params: { id: '10' }, body: { current_password: 'abcdef' } });
  assert.equal(r.status, 403, 'old password no longer valid');
  r = await call('post', '/notes/:id/lock/disable', { params: { id: '10' }, body: { current_password: 'newpass' } });
  assert.equal(r.status, 200); assert.equal(db.notes[0].is_locked, 0); assert.equal(db.notes[0].password_hash, null);

  // --- sharing
  r = await call('post', '/notes/:id/shares', { params: { id: '10' }, body: { emails: ['b@x.vn', 'ghost@x.vn', 'a@x.vn', 'bad'], permission: 'edit' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.shared.length, 1); assert.equal(r.body.errors.length, 3);
  r = await call('post', '/notes/:id/shares', { user: 2, params: { id: '10' }, body: { emails: ['a@x.vn'], permission: 'read' } });
  assert.equal(r.status, 403, 'recipient cannot share');
  r = await call('get', '/notes/:id/meta', { user: 1, params: { id: '10' } });
  assert.equal(r.body.meta.collab, true); assert.equal(r.body.meta.edit_share_count, 1);
  r = await call('get', '/notes/:id/meta', { user: 2, params: { id: '10' } });
  assert.equal(r.body.meta.role, 'edit');
  r = await call('put', '/notes/:id/shares/:shareId', { params: { id: '10', shareId: '1' }, body: { permission: 'read' } });
  assert.equal(db.shares[0].permission, 'read');
  r = await call('delete', '/notes/:id/shares/:shareId', { params: { id: '10', shareId: '1' } });
  assert.equal(db.shares.length, 0);

  // --- AI without key must fail gracefully (no crash)
  r = await call('post', '/ai/notes/:id/summary', { params: { id: '10' }, body: {} });
  assert.equal(r.status, 503, 'summary without LLM_API_KEY -> 503');
  r = await call('post', '/ai/ask', { body: { question: 'when do I buy milk?' } });
  assert.equal(r.status, 503);

  // --- RAG (keyword fallback path)
  const { retrieve, chunkText, plainText } = require(path.join(ROOT, 'modules/advanced/rag'));
  const found = await retrieve('milk friday', [
    { id: 1, title: 'Shopping', content: '<p>Buy milk &amp; eggs on Friday</p>', source: 'own' },
    { id: 2, title: 'Gym', content: 'Leg day on Monday', source: 'own' },
  ]);
  assert.equal(found.mode, 'keyword'); assert.equal(found.notes[0].id, 1);
  const viet = await retrieve('Đặt lịch họp khi nào', [{ id: 3, title: 'Lịch họp', content: 'Họp nhóm lúc 9h sáng thứ Hai', source: 'own' }, { id: 4, title: 'Khác', content: 'abc', source: 'own' }]);
  assert.equal(viet.notes[0].id, 3, 'Vietnamese diacritics handled');
  assert(chunkText('x'.repeat(5000)).length <= 6 && chunkText('x'.repeat(5000)).length > 1);
  assert.equal(plainText('<b>a</b>&nbsp;b'), 'a b');
  console.log('BACKEND SMOKE TEST OK');
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
