import React, { useCallback, useEffect, useState } from 'react';
import api from '../../../services/api';
import Modal from '../components/Modal';
import { apiError, formatDateTime } from '../components/format';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Owner's sharing dialog: share with one or more registered e-mails (read-only / can edit),
 * see everybody the note is shared with, change a permission or revoke access.
 */
export default function ShareDialog({ show, noteId, onClose }) {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [chips, setChips] = useState([]);
  const [input, setInput] = useState('');
  const [permission, setPermission] = useState('read');
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState([]);
  const [message, setMessage] = useState('');

  const notifyChanged = () => window.dispatchEvent(new Event('note-shares-changed'));

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.get(`/notes/${noteId}/shares`);
      setShares(res.data.shares || []);
    } catch (err) {
      setLoadError(apiError(err, 'Could not load the sharing list.'));
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    if (!show) return;
    setChips([]);
    setInput('');
    setProblems([]);
    setMessage('');
    setPermission('read');
    load();
  }, [show, load]);

  const addChips = (text) => {
    const parts = text.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!parts.length) return;
    setChips((current) => [...new Set([...current, ...parts])]);
    setInput('');
  };

  const onKeyDown = (e) => {
    if (['Enter', ',', ' ', ';'].includes(e.key) && input.trim()) {
      e.preventDefault();
      addChips(input);
    } else if (e.key === 'Backspace' && !input && chips.length) {
      setChips((c) => c.slice(0, -1));
    }
  };

  const share = async () => {
    const all = [...new Set([...chips, ...input.split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean)])];
    if (!all.length) return;
    setBusy(true);
    setProblems([]);
    setMessage('');
    try {
      const res = await api.post(`/notes/${noteId}/shares`, { emails: all, permission });
      const failed = res.data.errors || [];
      setChips(failed.map((f) => f.email));
      setInput('');
      setProblems(failed);
      setMessage(`Shared with ${res.data.shared.length} ${res.data.shared.length === 1 ? 'person' : 'people'}.`);
      notifyChanged();
      load();
    } catch (err) {
      setProblems(err.response?.data?.errors || [{ email: '', reason: apiError(err, 'Could not share the note.') }]);
    } finally {
      setBusy(false);
    }
  };

  const changePermission = async (share, value) => {
    setMessage('');
    try {
      await api.put(`/notes/${noteId}/shares/${share.id}`, { permission: value });
      setShares((list) => list.map((s) => (s.id === share.id ? { ...s, permission: value } : s)));
      notifyChanged();
    } catch (err) {
      setLoadError(apiError(err, 'Could not change the permission.'));
    }
  };

  const revoke = async (share) => {
    if (!window.confirm(`Stop sharing this note with ${share.email}?`)) return;
    setMessage('');
    try {
      await api.delete(`/notes/${noteId}/shares/${share.id}`);
      setShares((list) => list.filter((s) => s.id !== share.id));
      notifyChanged();
    } catch (err) {
      setLoadError(apiError(err, 'Could not revoke access.'));
    }
  };

  const invalidChip = (c) => !EMAIL_RE.test(c);

  return (
    <Modal show={show} title="Share note" onClose={onClose} busy={busy}>
      <label className="form-label small fw-semibold" htmlFor="share-email">People (registered e-mail addresses)</label>
      <div className="form-control d-flex flex-wrap gap-1 align-items-center mb-2" style={{ minHeight: 42 }}>
        {chips.map((c) => (
          <span key={c} className={`badge d-inline-flex align-items-center gap-1 ${invalidChip(c) ? 'text-bg-danger' : 'text-bg-secondary'}`}>
            {c}
            <button type="button" className="btn-close btn-close-white" style={{ fontSize: '0.55rem' }} aria-label={`Remove ${c}`} onClick={() => setChips((cur) => cur.filter((x) => x !== c))} />
          </span>
        ))}
        <input
          id="share-email"
          className="border-0 flex-grow-1 bg-transparent"
          style={{ outline: 'none', minWidth: 160 }}
          type="email"
          inputMode="email"
          placeholder={chips.length ? '' : 'name@tdtu.edu.vn, then Enter'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => input.trim() && addChips(input)}
          disabled={busy}
        />
      </div>

      <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
        <select className="form-select form-select-sm w-auto" value={permission} onChange={(e) => setPermission(e.target.value)} disabled={busy} aria-label="Permission">
          <option value="read">Read only</option>
          <option value="edit">Can edit</option>
        </select>
        <button type="button" className="btn btn-primary btn-sm" onClick={share} disabled={busy || (!chips.length && !input.trim())}>
          {busy ? 'Sharing...' : 'Share'}
        </button>
      </div>

      {message && <div className="alert alert-success py-2 small mb-2" role="status">{message}</div>}
      {problems.length > 0 && (
        <div className="alert alert-warning py-2 small mb-2" role="alert">
          {problems.map((p, i) => (
            <div key={`${p.email}-${i}`}>{p.email ? <strong>{p.email}: </strong> : null}{p.reason}</div>
          ))}
        </div>
      )}

      <hr />
      <h6 className="small fw-semibold">People with access</h6>
      {loading && <div className="text-muted small">Loading...</div>}
      {loadError && <div className="alert alert-danger py-2 small" role="alert">{loadError}</div>}
      {!loading && !loadError && shares.length === 0 && <div className="text-muted small">This note is not shared with anyone yet.</div>}
      <ul className="list-group list-group-flush">
        {shares.map((s) => (
          <li key={s.id} className="list-group-item px-0 d-flex flex-wrap align-items-center gap-2">
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="fw-semibold small text-truncate">{s.display_name || s.email}</div>
              <div className="text-muted small text-truncate">{s.email} · shared {formatDateTime(s.shared_at)}</div>
            </div>
            <select className="form-select form-select-sm w-auto" value={s.permission} onChange={(e) => changePermission(s, e.target.value)} aria-label={`Permission for ${s.email}`}>
              <option value="read">Read only</option>
              <option value="edit">Can edit</option>
            </select>
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => revoke(s)} title="Revoke access" aria-label={`Revoke access for ${s.email}`}>
              <i className="bi bi-person-x"></i>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
