import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../../services/api';
import { SHARED_SEEN_KEY } from './SharedWithMe';

/**
 * Prominent notification when somebody shared a note with the user since they last
 * opened "Shared with me" (the e-mail notification is sent by the server as well).
 */
export default function ShareNotice() {
  const location = useLocation();
  const [count, setCount] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token') || !navigator.onLine) return;
    let alive = true;
    const since = localStorage.getItem(SHARED_SEEN_KEY);
    api
      .get('/shared-notes', { params: since ? { since } : undefined })
      .then((res) => alive && setCount(res.data.count || 0))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (hidden || count === 0 || location.pathname.startsWith('/shared')) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(SHARED_SEEN_KEY, new Date().toISOString());
    } catch (err) {
      /* ignore */
    }
    setHidden(true);
  };

  return (
    <div className="position-fixed top-0 end-0 m-3 mt-5 pt-3" style={{ zIndex: 1080, maxWidth: 360 }} role="status" aria-live="polite">
      <div className="alert alert-info shadow d-flex align-items-start gap-2 mb-0">
        <i className="bi bi-people-fill mt-1"></i>
        <div className="flex-grow-1 small">
          You have <strong>{count}</strong> new shared {count === 1 ? 'note' : 'notes'}.{' '}
          <Link to="/shared" className="alert-link" onClick={dismiss}>View them</Link>
        </div>
        <button type="button" className="btn-close" aria-label="Dismiss" onClick={dismiss} />
      </div>
    </div>
  );
}
