import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Navbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = async () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);

    if (localStorage.getItem('token')) {
      try {
        await api.put('/auth/preferences', {
          theme: nextTheme,
          font_size: localStorage.getItem('font_size') || 'medium',
          note_color: localStorage.getItem('note_color') || '#ffffff'
        });
      } catch (err) {
        // Non-blocking preference sync
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand bg-body-tertiary border-bottom px-3 sticky-top">
      <div className="container-fluid">
        <div className="d-flex align-items-center gap-2">
          {/* Mobile menu button */}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-md-none"
            onClick={onToggleSidebar}
            title="Menu"
          >
            <i className="bi bi-list fs-5"></i>
          </button>

          {/* Brand */}
          <Link className="navbar-brand fw-bold text-primary mb-0" to="/">
            <i className="bi bi-journal-text me-2"></i>NoteApp
          </Link>
        </div>

        {/* Live Search placeholder */}
        <div className="d-none d-sm-block mx-auto" style={{ width: '360px' }}>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-body border-end-0">
              <i className="bi bi-search text-secondary"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search notes by keyword..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            <i className={`bi ${theme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill'}`}></i>
          </button>

          {user ? (
            <div className="d-flex align-items-center gap-2">
              <Link
                to="/profile"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
                title="View Profile"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className="rounded-circle object-fit-cover"
                    style={{ width: '22px', height: '22px' }}
                  />
                ) : (
                  <i className="bi bi-person-circle"></i>
                )}
                <span className="d-none d-md-inline">{user.display_name || user.email}</span>
              </Link>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={handleLogout}
                title="Logout"
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
