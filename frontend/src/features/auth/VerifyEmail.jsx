import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your account...');

  useEffect(() => {
    async function verify() {
      try {
        const res = await api.get(`/auth/verify/${token}`);
        if (res.data.success) {
          setStatus('success');
          setMessage(res.data.message);

          // Update local user state so warning banner disappears immediately
          const stored = JSON.parse(localStorage.getItem('user') || 'null');
          if (stored) {
            stored.is_verified = true;
            localStorage.setItem('user', JSON.stringify(stored));
          }
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Activation failed or link expired.');
      }
    }
    verify();
  }, [token]);

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-body-tertiary px-3">
      <div className="card shadow-sm border-0 p-4 text-center" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="mb-3">
          {status === 'loading' && <div className="spinner-border text-primary" role="status"></div>}
          {status === 'success' && <i className="bi bi-check-circle-fill text-success display-4"></i>}
          {status === 'error' && <i className="bi bi-x-circle-fill text-danger display-4"></i>}
        </div>

        <h5 className="fw-bold mb-2">Account Activation</h5>
        <p className="text-muted small mb-4">{message}</p>

        <Link to="/" className="btn btn-primary w-100">
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
