import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
import VerifyEmail from './features/auth/VerifyEmail';
import Profile from './features/auth/Profile';
import Preferences from './features/auth/Preferences';
import NoteList from './features/notes/NoteList';
import SharedWithMe from './features/advanced/share/SharedWithMe';
import SharedNoteEditor from './features/advanced/share/SharedNoteEditor';

// Redirect unauthenticated users to /login immediately
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
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify/:token" element={<VerifyEmail />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<NoteList />} />
          <Route path="/pinned" element={<NoteList />} />
          <Route path="/shared" element={<SharedWithMe />} />
          <Route path="/shared/:id" element={<SharedNoteEditor />} />
          <Route path="/labels" element={<NoteList />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/preferences" element={<Preferences />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
