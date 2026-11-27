const { test } = require('node:test');
const assert = require('node:assert/strict');
const { noteText, labelIds, operationId, serializeNote, escapeLike, requestHash } = require('../validation');
const { matchesType, rangeFor, storedPath } = require('../attachments');

test('blank notes and oversized titles are rejected', () => {
  for (const body of [{ title: ' ', content: 'hello' }, { title: 'hello', content: '\n' }, { title: 'x'.repeat(201), content: 'hello' }]) {
    assert.throws(() => noteText(body), { code: 'VALIDATION_ERROR' });
  }
  assert.equal(noteText({ title: ' title ', content: ' text ' }).content, ' text ');
});

test('labels must be bounded positive IDs and operations must be UUID v4', () => {
  assert.deepEqual(labelIds([1, '2', 1]), [1, 2]);
  assert.throws(() => labelIds([0]));
  assert.throws(() => labelIds(Array(21).fill(1)));
  assert.throws(() => operationId('forged'));
  assert.equal(operationId('5b44160e-4937-4136-bdc2-47c4c6f57491'), '5b44160e-4937-4136-bdc2-47c4c6f57491');
});

test('locked list serialization never leaks content, hash or labels', () => {
  const result = serializeNote({ id: 1, user_id: 1, actor_id: 1, is_locked: 1, password_hash: 'secret-hash', content: 'secret-content', title: 'Visible title' }, [{ id: 1, name: 'secret-label' }]);
  assert.equal(result.content_preview, null);
  assert.deepEqual(result.labels, []);
  assert.ok(!JSON.stringify(result).includes('secret'));
});

test('a share reader cannot become an editor through serialized flags', () => {
  const row = { user_id: 1, actor_id: 2, permission: 'read', content: 'safe', pinned_at: null };
  const result = serializeNote(row, [{ id: 1, name: 'owner private label' }]);
  assert.equal(result.access.can_edit, false);
  assert.equal(result.access.can_manage, false);
  assert.deepEqual(result.labels, []);
});

test('LIKE escape and canonical request digest preserve intent', () => {
  assert.equal(escapeLike('50%_!'), '50!%!_!!');
  const req = { method: 'PATCH', originalUrl: '/api/notes/1', body: { a: 1, b: 2 } };
  assert.equal(requestHash(req, 'secret'), requestHash({ ...req, body: { b: 2, a: 1 } }, 'secret'));
  assert.notEqual(requestHash(req, 'secret'), requestHash({ ...req, body: { a: 2, b: 2 } }, 'secret'));
});

test('fake file extensions cannot replace signature validation', () => {
  assert.equal(matchesType(Buffer.from('<script>alert(1)</script>'), 'image/png'), false);
  assert.equal(matchesType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'image/png'), true);
  assert.equal(matchesType(Buffer.from([0xff, 0xfe, 0]), 'text/plain'), false);
  assert.throws(() => storedPath('../../secret.env'));
});

test('video byte ranges include suffix ranges and reject malformed ranges', () => {
  assert.deepEqual(rangeFor('bytes=0-9', 100), { start: 0, end: 9 });
  assert.deepEqual(rangeFor('bytes=-10', 100), { start: 90, end: 99 });
  assert.deepEqual(rangeFor('bytes=90-', 100), { start: 90, end: 99 });
  assert.equal(rangeFor('bytes=100-200', 100), false);
  assert.equal(rangeFor('bytes=0-1,3-4', 100), false);
});
