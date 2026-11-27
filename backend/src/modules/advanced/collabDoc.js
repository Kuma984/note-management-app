/**
 * Server-side authoritative document used by the realtime layer.
 * Pure logic (no I/O) so it can be unit-tested.
 */
const { apply, transform, hash } = require('./ot');

const MAX_HISTORY = 1000;
const MAX_DOC_LENGTH = 2000000;

function isValidOp(op) {
  return (
    op &&
    Number.isInteger(op.p) && op.p >= 0 &&
    Number.isInteger(op.d) && op.d >= 0 &&
    typeof op.s === 'string' && op.s.length <= MAX_DOC_LENGTH
  );
}

class CollabDoc {
  constructor(text = '') {
    this.text = text;
    this.history = []; // history[i] produced revision (base + i + 1)
    this.base = 0;
  }

  get rev() {
    return this.base + this.history.length;
  }

  /**
   * A client sends an op created against server revision `rev`.
   * Returns { op, rev, h } (op already transformed) or null if it cannot be applied
   * (invalid op / revision too old) - caller should then resync that client.
   */
  submit(rev, op) {
    if (!isValidOp(op) || !Number.isInteger(rev) || rev < this.base || rev > this.rev) return null;
    let o = { p: op.p, d: op.d, s: op.s };
    for (let i = rev - this.base; i < this.history.length; i++) {
      o = transform(o, this.history[i], true);
    }
    if (o.p + o.d > this.text.length) return null;
    const next = apply(this.text, o);
    if (next.length > MAX_DOC_LENGTH) return null;
    this.text = next;
    this.history.push(o);
    if (this.history.length > MAX_HISTORY + 200) {
      this.history.splice(0, 200);
      this.base += 200;
    }
    return { op: o, rev: this.rev, h: hash(this.text) };
  }
}

module.exports = { CollabDoc, isValidOp, MAX_DOC_LENGTH };
