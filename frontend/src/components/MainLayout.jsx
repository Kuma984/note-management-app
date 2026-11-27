import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { NotesSearchProvider } from '../features/notes/NotesSearchContext';

export default function MainLayout() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <NotesSearchProvider><div className="d-flex flex-column min-vh-100">
      <Navbar />

      {/* Prominent banner for unverified account (as required in project rubric) */}
      {user && user.is_verified === false && (
        <div className="alert alert-warning text-center rounded-0 mb-0 py-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Your account is unverified. Please check your email to complete activation.
        </div>
      )}

      <div className="d-flex flex-grow-1">
        <Sidebar />
        <main className="flex-grow-1 p-3 p-md-4 bg-body" style={{ minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div></NotesSearchProvider>
  );
}
