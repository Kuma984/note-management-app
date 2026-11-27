import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-body-tertiary px-3">
      <div className="card shadow-sm border-0" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h4 className="fw-bold text-primary">NoteApp</h4>
            <p className="text-muted small">Sign in to your account</p>
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Email address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@tdtu.edu.vn"
                required
              />
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <label className="form-label small fw-semibold mb-1">Password</label>
                <Link to="/forgot-password" className="small text-decoration-none">Forgot password?</Link>
              </div>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-3 small">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
