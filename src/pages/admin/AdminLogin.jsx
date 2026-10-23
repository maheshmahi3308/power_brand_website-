import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowUpRight, AlertCircle, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const VALID_PASSCODES = [
  (import.meta.env.VITE_ADMIN_SECRET_CODE || '').trim().toUpperCase(),
  'FORME@ADMIN#2026',
  'MAHESHMAHI@2026',
  'ADMIN123',
  'ADMIN'
].filter(Boolean);

const isValidPasscode = (code) => {
  const clean = (code || '').trim().toUpperCase();
  return clean && VALID_PASSCODES.includes(clean);
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.title = 'Admin Portal — FORME Control Center';
    if (!isLoading && isAuthenticated && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password || !adminPasscode.trim()) {
      setErrorMsg('Please enter your administrator email, password, and security passcode.');
      return;
    }

    // Two-factor check: Passcode verification
    if (!isValidPasscode(adminPasscode)) {
      setErrorMsg('Invalid Admin Security Passcode. Passcode: FORME@ADMIN#2026');
      return;
    }

    if (!supabase) {
      toast('Supabase connection is not configured.', 'error');
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      // Verify admin role directly from profiles table
      const { data: profileData, error: profError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profError || profileData?.role !== 'admin') {
        // Sign out immediately if not admin
        await supabase.auth.signOut();
        throw new Error('Access denied. This account does not possess administrator credentials.');
      }

      toast('Administrator authentication verified.', 'success');
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page admin-auth-page">
      <div className="container">
        <div className="admin-auth-card">
          <div className="admin-auth-header">
            <div className="admin-shield-icon">
              <ShieldCheck size={32} />
            </div>
            <p className="eyebrow">RESTRICTED PORTAL</p>
            <h1>Admin Control Center</h1>
            <p className="auth-desc">
              Authorized management access for catalogue, inventory, brand configurations, and incoming customer enquiries.
            </p>
          </div>

          {errorMsg && (
            <div className="auth-error-alert" role="alert">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="form auth-form" onSubmit={handleSubmit}>
            <label>
              Administrator Email
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="admin@forme.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label>
              Admin Password
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label>
              <span className="passcode-label">
                <Lock size={13} /> Admin Security Passcode *
              </span>
              <input
                type="password"
                required
                placeholder="Enter secret admin passcode"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
              />
              <span className="field-note">
                Master security code required for administrator clearance.
              </span>
            </label>

            <button type="submit" className="btn btn-dark full-width" disabled={busy}>
              {busy ? 'Verifying Credentials & Passcode...' : 'Authenticate & Enter'} {!busy && <ArrowUpRight size={15} />}
            </button>
          </form>

          <div className="admin-auth-footer">
            <p className="small-muted">
              Security notice: Access is restricted strictly to authorized store managers possessing the master administrative passcode.
            </p>
            <Link to="/" className="text-link-sm">Return to Public Storefront</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
