import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    display_name: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        // Automatic login upon successful registration as required
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-body-tertiary px-3">
      <div className="card shadow-sm border-0" style={{ maxWidth: '440px', width: '100%' }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h4 className="fw-bold text-primary">NoteApp</h4>
            <p className="text-muted small">Create a new account</p>
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold">Email address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@tdtu.edu.vn"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Display Name</label>
              <input
                type="text"
                name="display_name"
                className="form-control"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Password</label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create password"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Confirm Password</label>
              <input
                type="password"
                name="confirm_password"
                className="form-control"
                value={formData.confirm_password}
                onChange={handleChange}
                placeholder="Repeat password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-2" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <div className="text-center mt-3 small">
            Already have an account? <Link to="/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
