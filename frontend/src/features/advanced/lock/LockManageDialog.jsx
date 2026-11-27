import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import Modal from '../components/Modal';
import { apiError } from '../components/format';
import { setNoteToken, clearNoteToken } from './noteTokens';

const EMPTY = { current: '', password: '', confirm: '' };

/**
 * Set / change / remove the password of ONE note (owner only).
 *  - not locked   -> "Set a password"        (password typed twice)
 *  - locked       -> tabs: "Change password" (current + new twice) | "Remove password" (current)
 */
export default function LockManageDialog({ show, noteId, isLocked, onClose, onChanged }) {
  const [mode, setMode] = useState('change');
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (show) {
      setForm(EMPTY);
      setError('');
      setMode('change');
    }
  }, [show]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const action = !isLocked ? 'enable' : mode;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (action !== 'disable' && form.password !== form.confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      if (action === 'enable') {
        const res = await api.post(`/notes/${noteId}/lock`, { password: form.password, confirm_password: form.confirm });
        setNoteToken(noteId, res.data.noteToken, res.data.expiresIn);
      } else if (action === 'change') {
        const res = await api.put(`/notes/${noteId}/lock/password`, {
          current_password: form.current,
          new_password: form.password,
          confirm_password: form.confirm,
        });
        setNoteToken(noteId, res.data.noteToken, res.data.expiresIn);
      } else {
        await api.post(`/notes/${noteId}/lock/disable`, { current_password: form.current });
        clearNoteToken(noteId);
      }
      window.dispatchEvent(new Event('note-lock-changed'));
      onChanged?.(action !== 'disable');
      onClose();
    } catch (err) {
      setError(apiError(err, 'Could not update the password.'));
    } finally {
      setBusy(false);
    }
  };

  const field = (id, label, value, onChange, props = {}) => (
    <div className="mb-3">
      <label className="form-label small fw-semibold" htmlFor={id}>{label}</label>
      <input id={id} type="password" className="form-control" value={value} onChange={onChange} autoComplete="new-password" disabled={busy} {...props} />
    </div>
  );

  const title = !isLocked ? 'Protect this note with a password' : mode === 'change' ? 'Change note password' : 'Remove note password';
  const submitLabel = action === 'enable' ? 'Set password' : action === 'change' ? 'Change password' : 'Remove password';
  const needsNew = action !== 'disable';
  const canSubmit = needsNew ? form.password && form.confirm && (action === 'enable' || form.current) : form.current;

  return (
    <Modal show={show} title={title} onClose={onClose} busy={busy}>
      {isLocked && (
        <ul className="nav nav-pills nav-fill small mb-3">
          {[['change', 'Change password'], ['disable', 'Remove password']].map(([key, label]) => (
            <li className="nav-item" key={key}>
              <button type="button" className={`nav-link ${mode === key ? 'active' : ''}`} onClick={() => { setMode(key); setError(''); setForm(EMPTY); }}>
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={submit}>
        {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
        {!isLocked && (
          <p className="small text-muted">
            Anyone opening, editing or deleting this note will have to enter this password. Each note has its own password.
          </p>
        )}
        {action === 'disable' && <p className="small text-muted">Enter the current password to confirm that you want to remove the protection.</p>}
        {isLocked && field('lock-current', 'Current password', form.current, set('current'), { autoFocus: true })}
        {needsNew && field('lock-new', isLocked ? 'New password' : 'Password', form.password, set('password'), { autoFocus: !isLocked, minLength: 6 })}
        {needsNew && field('lock-confirm', isLocked ? 'Confirm new password' : 'Confirm password', form.confirm, set('confirm'))}
        {needsNew && <div className="form-text mb-3">At least 6 characters.</div>}
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className={`btn btn-sm ${action === 'disable' ? 'btn-danger' : 'btn-primary'}`} disabled={busy || !canSubmit}>
            {busy ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
