import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function ResetPassword() {
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = 'Set New Password — FORME';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!supabase) {
      toast('Supabase connection is unavailable.', 'error');
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      toast('Password updated successfully! Please sign in with your new password.', 'success');
    } catch (err) {
      console.error('Password update error:', err);
      setErrorMsg(err.message || 'Could not update password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-header">
            <Link to="/" className="wordmark">FORME<span>®</span></Link>
            <p className="eyebrow">ACCOUNT RECOVERY</p>
            <h1>Set New Password</h1>
            <p className="auth-desc">
              Choose a secure password for your FORME account.
            </p>
          </div>

          {success ? (
            <div className="form-success-state">
              <CheckCircle2 size={44} className="success-icon" />
              <h2>Password Changed</h2>
              <p>Your password has been reset successfully.</p>
              <Link to="/login" className="btn btn-dark full-width">
                Proceed to Sign In
              </Link>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="auth-error-alert" role="alert">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form className="form auth-form" onSubmit={handleSubmit}>
                <label>
                  New Password (min 6 chars)
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>

                <label>
                  Confirm New Password
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>

                <button type="submit" className="btn btn-dark full-width" disabled={busy}>
                  {busy ? 'Updating...' : 'Update Password'} {!busy && <ArrowUpRight size={15} />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
