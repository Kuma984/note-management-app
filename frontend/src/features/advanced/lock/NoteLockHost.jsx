import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import Modal from '../components/Modal';
import { apiError } from '../components/format';
import { registerUnlockHost, settleUnlock, setNoteToken } from './noteTokens';

/** Mounted once (inside AdvancedHost). Shows the "enter password" dialog for locked notes. */
export default function NoteLockHost() {
  const [queue, setQueue] = useState([]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const noteId = queue[0] ?? null;

  useEffect(() => {
    const unregister = registerUnlockHost();
    const onRequest = (e) => setQueue((q) => (q.includes(e.detail.noteId) ? q : [...q, e.detail.noteId]));
    window.addEventListener('note-unlock-request', onRequest);
    return () => {
      window.removeEventListener('note-unlock-request', onRequest);
      unregister();
    };
  }, []);

  useEffect(() => {
    setPassword('');
    setError('');
  }, [noteId]);

  const finish = (ok) => {
    settleUnlock(noteId, ok);
    setQueue((q) => q.slice(1));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.post(`/notes/${noteId}/unlock`, { password });
      if (res.data.noteToken) setNoteToken(noteId, res.data.noteToken, res.data.expiresIn);
      finish(true);
    } catch (err) {
      setError(apiError(err, 'Could not unlock this note.'));
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={noteId !== null} title="This note is password protected" onClose={() => finish(false)} busy={busy} size="modal-sm">
      <form onSubmit={submit}>
        <p className="small text-muted mb-3">
          <i className="bi bi-lock-fill me-1"></i>Enter the password of this note to continue.
        </p>
        {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
        <label className="form-label small fw-semibold" htmlFor="note-unlock-password">Note password</label>
        <input
          id="note-unlock-password"
          type="password"
          className="form-control mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          autoComplete="off"
          disabled={busy}
        />
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => finish(false)} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !password}>
            {busy ? 'Unlocking...' : 'Unlock'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
