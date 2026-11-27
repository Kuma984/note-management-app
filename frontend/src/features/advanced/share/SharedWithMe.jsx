import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { SHARED_NOTE_ROUTE } from '../config';
import { apiError, formatDateTime, plainText } from '../components/format';

export const SHARED_SEEN_KEY = 'sharedNotesSeenAt';

/** "Shared with me" section: who shared, read-only / editable, when it was shared. */
export default function SharedWithMe() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/shared-notes');
      setNotes(res.data.notes || []);
      try {
        localStorage.setItem(SHARED_SEEN_KEY, new Date().toISOString());
      } catch (err) {
        /* ignore */
      }
    } catch (err) {
      setError(apiError(err, 'Could not load the notes shared with you.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Shared with me</h4>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {loading && !notes.length && (
        <div className="text-center text-muted py-5">
          <div className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></div>Loading shared notes...
        </div>
      )}

      {!loading && !error && notes.length === 0 && (
        <div className="card text-center p-5">
          <div className="card-body">
            <i className="bi bi-people display-5 text-secondary"></i>
            <h5 className="card-title mt-3 text-secondary">Nothing shared with you yet</h5>
            <p className="card-text text-muted small mb-0">When someone shares a note with your e-mail address, it will appear here.</p>
          </div>
        </div>
      )}

      <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
        {notes.map((n) => {
          const canEdit = n.permission === 'edit';
          return (
            <div className="col" key={n.share_id}>
              <div
                className="card h-100 shadow-sm"
                role="button"
                tabIndex={0}
                onClick={() => navigate(SHARED_NOTE_ROUTE(n.id))}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(SHARED_NOTE_ROUTE(n.id))}
              >
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <h6 className="card-title mb-0 text-break">{n.title || 'Untitled'}</h6>
                    <span className="d-flex gap-1 flex-shrink-0">
                      {n.is_locked ? <i className="bi bi-lock-fill text-warning" title="Password protected"></i> : null}
                      <i className="bi bi-people-fill text-primary" title="Shared"></i>
                    </span>
                  </div>
                  <p className="card-text small text-muted flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {n.is_locked ? 'Password protected note' : plainText(n.snippet) || 'No content'}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className={`badge ${canEdit ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      <i className={`bi ${canEdit ? 'bi-pencil-square' : 'bi-eye'} me-1`}></i>{canEdit ? 'Can edit' : 'Read only'}
                    </span>
                  </div>
                  <div className="small text-muted text-truncate">
                    <i className="bi bi-person me-1"></i>Shared by {n.owner_name || n.owner_email}
                  </div>
                  <div className="small text-muted">
                    <i className="bi bi-clock me-1"></i>{formatDateTime(n.shared_at)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
