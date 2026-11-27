import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [displayName, setDisplayName] = useState(user.display_name || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
          setDisplayName(res.data.user.display_name);
          setAvatarPreview(res.data.user.avatar_url || '');
          localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchProfile();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setProfileErr('Only JPG, PNG, and WEBP images are allowed.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileErr('Image size must be under 2MB.');
      return;
    }

    setProfileErr('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');

    try {
      const formData = new FormData();
      formData.append('display_name', displayName);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setUser(res.data.user);
        setAvatarPreview(res.data.user.avatar_url || '');
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setProfileMsg('Profile updated successfully.');
      }
    } catch (err) {
      setProfileErr(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassErr('');

    if (newPassword !== confirmPassword) {
      setPassErr('New passwords do not match.');
      return;
    }

    try {
      const res = await api.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      if (res.data.success) {
        alert('Password changed successfully. Please sign in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (err) {
      setPassErr(err.response?.data?.message || 'Failed to change password.');
    }
  };

  return (
    <div className="container-fluid">
      <h4 className="fw-bold mb-4">My Profile</h4>

      <div className="row g-4">
        {/* Profile Information Card */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">Profile & Avatar</h6>

              {profileMsg && <div className="alert alert-success py-2 small">{profileMsg}</div>}
              {profileErr && <div className="alert alert-danger py-2 small">{profileErr}</div>}

              <div className="d-flex align-items-center gap-3 mb-4">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="rounded-circle border object-fit-cover"
                    style={{ width: '72px', height: '72px' }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-3"
                    style={{ width: '72px', height: '72px' }}
                  >
                    {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <div className="fw-semibold">{user.email}</div>
                  <span className={`badge ${user.is_verified ? 'text-bg-success' : 'text-bg-warning'}`}>
                    {user.is_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Display Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Upload New Avatar (JPG, PNG, WEBP &le; 2MB)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Save Profile
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h6 className="fw-bold mb-3">Change Password</h6>

              {passMsg && <div className="alert alert-success py-2 small">{passMsg}</div>}
              {passErr && <div className="alert alert-danger py-2 small">{passErr}</div>}

              <form onSubmit={handlePasswordSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-outline-primary">
                  Update Password
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
