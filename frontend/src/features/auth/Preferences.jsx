import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const NOTE_COLORS = [
  { label: 'Default White', value: '#ffffff' },
  { label: 'Soft Yellow', value: '#fef9c3' },
  { label: 'Mint Green', value: '#dcfce7' },
  { label: 'Sky Blue', value: '#dbeafe' },
  { label: 'Soft Pink', value: '#fce7f3' },
];

export default function Preferences() {
  const [fontSize, setFontSize] = useState('medium');
  const [noteColor, setNoteColor] = useState('#ffffff');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success && res.data.user.preferences) {
          const prefs = res.data.user.preferences;
          setFontSize(prefs.font_size || 'medium');
          setNoteColor(prefs.note_color || '#ffffff');
          setTheme(prefs.theme || 'light');
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadPreferences();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await api.put('/auth/preferences', {
        font_size: fontSize,
        note_color: noteColor,
        theme
      });

      if (res.data.success) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        localStorage.setItem('font_size', fontSize);
        localStorage.setItem('note_color', noteColor);
        setMessage('Preferences saved successfully.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save preferences.');
    }
  };

  return (
    <div className="container-fluid" style={{ maxWidth: '600px' }}>
      <h4 className="fw-bold mb-4">User Preferences</h4>

      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          {message && <div className="alert alert-success py-2 small">{message}</div>}
          {error && <div className="alert alert-danger py-2 small">{error}</div>}

          <form onSubmit={handleSave}>
            {/* Theme */}
            <div className="mb-3">
              <label className="form-label small fw-semibold">Appearance Theme</label>
              <select
                className="form-select"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
              </select>
            </div>

            {/* Font Size */}
            <div className="mb-3">
              <label className="form-label small fw-semibold">Note Font Size</label>
              <select
                className="form-select"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium (Default)</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Note Color */}
            <div className="mb-4">
              <label className="form-label small fw-semibold">Default Note Background Color</label>
              <div className="d-flex flex-wrap gap-2">
                {NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNoteColor(c.value)}
                    className={`btn btn-sm border ${noteColor === c.value ? 'border-primary border-2 fw-bold' : ''}`}
                    style={{ backgroundColor: c.value, color: '#000' }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              Save Preferences
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
