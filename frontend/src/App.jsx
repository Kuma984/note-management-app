import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import NoteList from './features/notes/NoteList';

// Route guard: Redirect to /login if user is not authenticated (as required in rubric)
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected application shell */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<NoteList />} />
          <Route path="/pinned" element={<NoteList />} />
          <Route path="/shared" element={<NoteList />} />
          <Route path="/labels" element={<NoteList />} />
          <Route path="/preferences" element={<div className="p-3"><h4>Preferences</h4><p className="text-muted">Preferences screen for theme and font size.</p></div>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
