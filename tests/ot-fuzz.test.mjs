/**
 * Randomised tests for the collaboration core.
 * Run from the repo root of the project:  node tests/ot-fuzz.test.mjs
 * (adjust the two import paths below if your folders are named differently)
 */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import * as clientOt from '../frontend/src/features/advanced/collab/ot.js';
import { ClientDoc } from '../frontend/src/features/advanced/collab/ClientDoc.js';

const require = createRequire(import.meta.url);
const serverOt = require('../backend/src/modules/advanced/ot.js');
const { CollabDoc } = require('../backend/src/modules/advanced/collabDoc.js');

// ---- tiny seeded RNG so failures are reproducible
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const int = (n) => Math.floor(rnd() * n);
const ALPHA = 'abc \nđé😀';
const word = (max) => Array.from({ length: int(max + 1) }, () => ALPHA[int(ALPHA.length)]).join('');

function randomOp(text) {
  const p = int(text.length + 1);
  const d = int(Math.min(4, text.length - p) + 1);
  return { p, d, s: word(3) };
}

// 1. both copies of the OT core behave identically
for (const k of ['apply', 'diff', 'transform', 'mapPos', 'hash']) {
  assert.equal(typeof clientOt[k], 'function');
  assert.equal(clientOt[k].toString().replace(/\s+/g, ''), serverOt[k].toString().replace(/\s+/g, ''), `${k} differs`);
}

// 2. diff/apply round trip
for (let i = 0; i < 5000; i++) {
  const a = word(12);
  const b = word(12);
  const op = serverOt.diff(a, b);
  assert.equal(op ? serverOt.apply(a, op) : a, b);
}

// 3. TP1 convergence of transform for random concurrent ops
for (let i = 0; i < 200000; i++) {
  const doc = word(10);
  const a = randomOp(doc);
  const b = randomOp(doc);
  const s1 = serverOt.apply(serverOt.apply(doc, b), serverOt.transform(a, b, true));
  const s2 = serverOt.apply(serverOt.apply(doc, a), serverOt.transform(b, a, false));
  assert.equal(s1, s2, `TP1 failed doc=${JSON.stringify(doc)} a=${JSON.stringify(a)} b=${JSON.stringify(b)}`);
}

// 4. full simulation: server + N clients, random edits, random message delivery order
function simulate(clientCount, steps) {
  const server = new CollabDoc(word(15));
  const clients = Array.from({ length: clientCount }, () => new ClientDoc(server.text, server.rev));
  const toServer = clients.map(() => []);
  const toClient = clients.map(() => []);
  let resyncs = 0;

  const deliverToServer = (i) => {
    const msg = toServer[i].shift();
    const res = server.submit(msg.rev, msg.op);
    assert.ok(res, 'server rejected a valid op');
    toClient[i].push({ t: 'ack', rev: res.rev, h: res.h });
    clients.forEach((_, j) => j !== i && toClient[j].push({ t: 'op', rev: res.rev, op: res.op, h: res.h }));
  };
  const deliverToClient = (i) => {
    const out = clients[i].receive(toClient[i].shift());
    if (out.send) toServer[i].push(out.send);
    if (out.resync) resyncs++;
  };

  for (let s = 0; s < steps; s++) {
    const c = int(clientCount);
    const r = rnd();
    if (r < 0.4) {
      const doc = clients[c];
      const op = randomOp(doc.local);
      const msg = doc.setLocal(serverOt.apply(doc.local, op));
      if (msg) toServer[c].push(msg);
    } else if (r < 0.7) {
      const i = int(clientCount);
      if (toServer[i].length) deliverToServer(i);
    } else {
      const i = int(clientCount);
      if (toClient[i].length) deliverToClient(i);
    }
  }
  // drain everything
  let busy = true;
  while (busy) {
    busy = false;
    for (let i = 0; i < clientCount; i++) {
      while (toServer[i].length) { deliverToServer(i); busy = true; }
      while (toClient[i].length) { deliverToClient(i); busy = true; }
    }
  }
  clients.forEach((c, i) => {
    assert.equal(c.local, server.text, `client ${i} diverged`);
    assert.equal(c.pending, null);
  });
  assert.equal(resyncs, 0, 'hash check requested an unexpected resync');
}

for (let run = 0; run < 3000; run++) simulate(2 + int(3), 60 + int(80));

console.log('OK: OT core, TP1 (200k pairs) and 3000 multi-client simulations all converge');
