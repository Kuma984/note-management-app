const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const load = () => import(pathToFileURL(path.resolve(__dirname, '../../../../../frontend/src/features/notes/autosave.js')));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const baseNote = { id: 1, title: 'Old', content: 'Text', version: 1, access: { role: 'owner' } };

test('typing during a slow create does not create twice or mark the newer draft saved', async () => {
  const { AutosaveSession } = await load();
  const wait = deferred();
  let creates = 0;
  let updates = 0;
  const api = { create: () => { creates++; return wait.promise; }, update: async (id, body) => { updates++; return { note: { ...baseNote, ...body, id, version: 2 } }; } };
  const session = new AutosaveSession({ api, delay: 60000 });
  session.change('title', 'First'); session.change('content', 'Text');
  const saving = session.save();
  session.change('title', 'Latest');
  const sameSave = session.save();
  wait.resolve({ note: { ...baseNote, title: 'First', content: 'Text' } });
  await Promise.all([saving, sameSave]);
  assert.equal(creates, 1);
  assert.equal(updates, 0);
  assert.equal(session.snapshot().dirty, true);
  assert.equal(session.snapshot().title, 'Latest');
  await session.flush();
  assert.equal(updates, 1);
  assert.equal(session.snapshot().dirty, false);
  session.dispose();
});

test('lost create ACK retries the exact same operation and body', async () => {
  const { AutosaveSession } = await load();
  const calls = [];
  const api = { create: async body => {
    calls.push({ ...body });
    if (calls.length === 1) throw new Error('network lost after commit');
    return { note: { ...baseNote, title: body.title, content: body.content }, mutation: { replayed: true, applied_version: 1 } };
  } };
  const session = new AutosaveSession({ api, delay: 60000 });
  session.change('title', 'First'); session.change('content', 'Text');
  await session.save();
  assert.equal(session.status, 'error');
  session.change('title', 'New draft');
  await session.save();
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(session.snapshot().title, 'New draft');
  assert.equal(session.snapshot().dirty, true);
  session.dispose();
});

test('remote clean updates never trigger a save; dirty updates require an explicit decision', async () => {
  const { AutosaveSession } = await load();
  let writes = 0;
  const session = new AutosaveSession({ note: baseNote, api: { update: () => { writes++; } }, delay: 60000 });
  session.receiveRemote({ ...baseNote, title: 'Remote', version: 2 });
  assert.equal(session.snapshot().title, 'Remote');
  assert.equal(session.snapshot().dirty, false);
  session.change('title', 'Local draft');
  session.receiveRemote({ ...baseNote, title: 'Another remote', version: 3 });
  assert.equal(session.status, 'conflict');
  assert.equal(session.snapshot().title, 'Local draft');
  assert.equal(await session.flush(), false);
  session.resolve('server');
  assert.equal(session.snapshot().title, 'Another remote');
  assert.equal(writes, 0);
  session.dispose();
});

test('a blank draft never creates a row and invalid edits cannot overwrite a saved note', async () => {
  const { AutosaveSession } = await load();
  let writes = 0;
  const api = { create: () => { writes++; }, update: () => { writes++; } };
  const session = new AutosaveSession({ api, delay: 60000 });
  session.change('title', 'Title only');
  assert.equal(await session.flush(), false);
  assert.equal(writes, 0);
  session.dispose();
});

test('an old ACK cannot hide an invalid newer draft', async () => {
  const { AutosaveSession } = await load();
  const wait = deferred();
  const session = new AutosaveSession({ note: baseNote, api: { update: () => wait.promise }, delay: 60000 });
  session.change('title', 'Valid title');
  const saving = session.save();
  session.change('title', '');
  wait.resolve({ note: { ...baseNote, title: 'Valid title', version: 2 } });
  await saving;
  assert.equal(session.status, 'invalid');
  assert.equal(session.snapshot().title, '');
  assert.equal(await session.flush(), false);
  session.dispose();
});

test('a definitive validation failure allows the corrected draft to be submitted', async () => {
  const { AutosaveSession } = await load();
  const bodies = [];
  const api = { update: async (id, body) => {
    bodies.push(body);
    if (bodies.length === 1) throw Object.assign(new Error('Validation failed'), { status: 422 });
    return { note: { ...baseNote, ...body, version: 2 } };
  } };
  const session = new AutosaveSession({ note: baseNote, api, delay: 60000 });
  session.change('title', 'Rejected'); await session.save();
  session.change('title', 'Corrected'); await session.save();
  assert.equal(bodies[1].title, 'Corrected');
  assert.notEqual(bodies[0].operation_id, bodies[1].operation_id);
  assert.equal(session.status, 'saved');
  session.dispose();
});
