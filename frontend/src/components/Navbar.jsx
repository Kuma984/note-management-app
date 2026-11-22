import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Toggle light/dark theme using Bootstrap 5.3 data-bs-theme
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand bg-body-tertiary border-bottom px-3 sticky-top">
      <div className="container-fluid">
        {/* Brand */}
        <Link className="navbar-brand fw-bold text-primary" to="/">
          <i className="bi bi-journal-text me-2"></i>NoteApp
        </Link>

        {/* Live Search placeholder (Member 2 will hook up live debounce) */}
        <div className="d-none d-sm-block mx-auto" style={{ width: '380px' }}>
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
          {/* Dark / Light Toggle */}
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            <i className={`bi ${theme === 'dark' ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill'}`}></i>
          </button>

          {/* User section */}
          {user ? (
            <div className="dropdown">
              <button
                className="btn btn-sm btn-outline-primary dropdown-toggle d-flex align-items-center gap-1"
                type="button"
                data-bs-toggle="dropdown"
                onClick={handleLogout}
                title="Click to logout"
              >
                <i className="bi bi-person-circle"></i>
                <span className="d-none d-md-inline">{user.display_name || user.email}</span>
                <span className="badge text-bg-danger ms-1">Logout</span>
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
