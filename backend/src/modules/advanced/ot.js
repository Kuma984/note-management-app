/**
 * Tiny operational-transformation core for plain-text collaboration.
 *
 * An operation is ONE contiguous replacement: { p, d, s }
 *   p = start index, d = number of UTF-16 units deleted, s = text inserted at p.
 *
 * transform(x, y, xAfterY) rewrites op `x` so it can be applied AFTER `y`
 * (both were created against the same document). `xAfterY` is the tie-break
 * used when both ops insert at the same place / replace the same range:
 * the op that is "after" ends up after (or wins).
 *
 * Property verified by tests/ot-fuzz.test.mjs (TP1):
 *   apply(apply(doc, y), transform(x, y, true)) === apply(apply(doc, x), transform(y, x, false))
 *
 * NOTE: the frontend has an identical copy (frontend/src/features/advanced/collab/ot.js,
 * generated from this file). Keep both in sync.
 */

function apply(text, op) {
  return text.slice(0, op.p) + op.s + text.slice(op.p + op.d);
}

/** Smallest single replacement turning `a` into `b` (null when equal). */
function diff(a, b) {
  if (a === b) return null;
  const max = Math.min(a.length, b.length);
  let start = 0;
  while (start < max && a.charCodeAt(start) === b.charCodeAt(start)) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a.charCodeAt(endA - 1) === b.charCodeAt(endB - 1)) {
    endA--;
    endB--;
  }
  return { p: start, d: endA - start, s: b.slice(start, endB) };
}

function transform(x, y, xAfterY) {
  const xs = x.p;
  const xe = x.p + x.d;
  const ys = y.p;
  const ye = y.p + y.d;
  const ylen = y.s.length;

  // 1. Two pure inserts at the same index -> tie-break.
  if (x.d === 0 && y.d === 0 && xs === ys) {
    return { p: xAfterY ? xs + ylen : xs, d: 0, s: x.s };
  }
  // 2. y lies completely before x -> shift x.
  if (ye <= xs) return { p: xs + ylen - y.d, d: x.d, s: x.s };
  // 3. y lies completely after x -> x unchanged.
  if (xe <= ys) return { p: xs, d: x.d, s: x.s };

  // 4. The replaced ranges overlap.
  const xInY = ys <= xs && xe <= ye;
  const yInX = xs <= ys && ye <= xe;
  if (xInY && yInX) {
    // identical ranges: the "later" op wins, the other becomes a no-op
    return xAfterY ? { p: xs, d: x.d - y.d + ylen, s: x.s } : { p: ys, d: 0, s: '' };
  }
  if (yInX) return { p: xs, d: x.d - y.d + ylen, s: x.s }; // x swallows y
  if (xInY) return { p: ys, d: 0, s: '' }; // x was inside y's deleted range
  if (xs < ys) return { p: xs, d: ys - xs, s: x.s }; // partial overlap, x starts first
  return { p: ys + ylen, d: xe - ye, s: x.s }; // partial overlap, y starts first
}

/** Move a caret/selection index through an op that was applied remotely. */
function mapPos(pos, op) {
  if (pos <= op.p) return pos;
  if (pos >= op.p + op.d) return pos + op.s.length - op.d;
  return op.p + op.s.length;
}

/** 32-bit FNV-1a over UTF-16 units; used as a cheap divergence check. */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

module.exports = { apply, diff, transform, mapPos, hash };
