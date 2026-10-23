import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, LogOut, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AdminProfile() {
  const { profile, session, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Admin Profile & Security — FORME';
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      toast('Passwords do not match.', 'error');
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast('Admin password updated successfully.', 'success');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast(err.message || 'Error updating password.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast('Logged out of Admin Portal.', 'success');
    navigate('/admin/login');
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">ADMINISTRATOR CREDENTIALS</p>
          <h1>Profile &amp; Security</h1>
          <p className="page-subtitle">Manage administrative session, security settings, and password updates.</p>
        </div>
      </div>

      <div className="admin-profile-grid">
        <div className="admin-card">
          <div className="admin-profile-identity">
            <div className="admin-avatar-box">
              <ShieldCheck size={36} />
            </div>
            <div>
              <span className="role-badge-admin">VERIFIED ADMINISTRATOR</span>
              <h2>{profile?.full_name || 'Administrator'}</h2>
              <p className="small-muted">{session?.user?.email}</p>
              <span className="font-mono small-muted">ID: {session?.user?.id}</span>
            </div>
          </div>

          <div className="admin-security-info mt-6">
            <h3>Database Privileges</h3>
            <p>
              Role verified via PostgreSQL function <code>public.is_admin()</code> and checked by Row Level Security policies on every read/write operation.
            </p>
          </div>

          <div className="mt-6">
            <button className="btn btn-outline" onClick={handleLogout}>
              <LogOut size={15} /> Sign Out of Admin Portal
            </button>
          </div>
        </div>

        <div className="admin-card">
          <h2>Update Admin Password</h2>
          <p className="small-muted mb-4">Choose a strong password containing at least 8 characters.</p>

          <form className="form" onSubmit={handlePasswordChange}>
            <label>
              New Password (min 8 chars)
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label>
              Confirm New Password
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>

            <button type="submit" className="btn btn-dark" disabled={busy}>
              {busy ? 'Updating...' : 'Save New Password'} {!busy && <ArrowUpRight size={14} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
