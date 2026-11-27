import { apply, diff, transform, hash } from './ot.js';

/**
 * Client side of the collaboration protocol (pure state machine, no React / no socket).
 *
 *  - `rev`     : last server revision this client has integrated
 *  - `pending` : the ONE op currently in flight to the server (or null)
 *  - `shadow`  : server text + pending (what the server will have once `pending` is acked)
 *  - `local`   : what is in the textarea (shadow + not-yet-sent edits)
 *
 * Unsent edits are never stored as ops: they are recomputed as diff(shadow, local),
 * which keeps the algorithm small and easy to reason about.
 */
export class ClientDoc {
  constructor(text = '', rev = 0) {
    this.reset(text, rev);
  }

  reset(text, rev) {
    this.rev = rev;
    this.shadow = text;
    this.local = text;
    this.pending = null;
  }

  /** The textarea content changed. Returns a message to send, or null. */
  setLocal(text) {
    this.local = text;
    return this.flush();
  }

  /** Send the buffered edit if nothing is in flight. */
  flush() {
    if (this.pending || this.local === this.shadow) return null;
    const op = diff(this.shadow, this.local);
    if (!op) return null;
    this.pending = op;
    this.shadow = this.local;
    return { t: 'op', rev: this.rev, op };
  }

  /**
   * Process a server message ('ack' | 'op' | 'doc').
   * Returns { send, text, op, resync }:
   *   send   - message to send back to the server (next buffered op) or null
   *   text   - new full textarea content if it changed (else null)
   *   op     - the op applied to the textarea (for caret mapping) or null
   *   resync - true when a divergence was detected and a 'resync' must be requested
   */
  receive(msg) {
    const out = { send: null, text: null, op: null, resync: false };

    if (msg.t === 'ack') {
      this.pending = null;
      this.rev = msg.rev;
      out.send = this.flush();
      if (!this.pending && this.local === this.shadow && hash(this.shadow) !== msg.h) out.resync = true;
    } else if (msg.t === 'op') {
      let remote = msg.op;
      if (this.pending) {
        const mine = this.pending;
        this.pending = transform(mine, remote, true);
        remote = transform(remote, mine, false);
      }
      const buffered = diff(this.shadow, this.local);
      const forLocal = buffered ? transform(remote, buffered, false) : remote;
      this.local = apply(this.local, forLocal);
      this.shadow = apply(this.shadow, remote);
      this.rev = msg.rev;
      out.text = this.local;
      out.op = forLocal;
      if (!this.pending && this.local === this.shadow && hash(this.shadow) !== msg.h) out.resync = true;
    } else if (msg.t === 'doc') {
      this.reset(msg.text, msg.rev);
      out.text = this.local;
    }
    return out;
  }
}
