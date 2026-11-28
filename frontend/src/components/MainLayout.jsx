import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import api from '../services/api';
import { NotesSearchProvider } from '../features/notes/NotesSearchContext';
import AdvancedHost from '../features/advanced/AdvancedHost';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  useEffect(() => {
    async function syncUser() {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));

          if (res.data.user.preferences) {
            const { theme, font_size, note_color } = res.data.user.preferences;
            document.documentElement.setAttribute('data-bs-theme', theme || 'light');
            localStorage.setItem('theme', theme || 'light');
            localStorage.setItem('font_size', font_size || 'medium');
            localStorage.setItem('note_color', note_color || '#ffffff');
          }
        }
      } catch (err) {
        // Handled by auth interceptors if needed
      }
    }
    syncUser();
  }, []);

  return (
    <NotesSearchProvider>
      <div className="d-flex flex-column min-vh-100">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Prominent notification when account is unverified */}
        {user && user.is_verified === false && (
          <div className="alert alert-warning text-center rounded-0 mb-0 py-2 small" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            Your account is unverified. Please check your email to complete the activation process.
          </div>
        )}

        <div className="d-flex flex-grow-1">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-grow-1 p-3 p-md-4 bg-body" style={{ minWidth: 0 }}>
            <Outlet />
          </main>
        </div>

        {/* Member 3: note password dialog, share notice, Ask AI, offline banner */}
        <AdvancedHost />
      </div>
    </NotesSearchProvider>
  );
}
