import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.title = 'Forgot Password — FORME';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!supabase) {
      toast('Supabase connection is not configured.', 'error');
      return;
    }

    setBusy(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl
      });

      if (error) throw error;
      setSent(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      // For security, do not disclose whether email exists, but show technical failures if any
      setErrorMsg(err.message || 'Could not send reset instructions.');
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
            <p className="eyebrow">RECOVERY</p>
            <h1>Reset Password</h1>
            <p className="auth-desc">
              Enter your registered email address and we will send you a secure link to reset your account password.
            </p>
          </div>

          {sent ? (
            <div className="form-success-state">
              <CheckCircle2 size={44} className="success-icon" />
              <h2>Reset Link Sent</h2>
              <p>
                If an account matches <strong>{email}</strong>, a password reset link has been dispatched to your inbox. Please check your spam folder as well.
              </p>
              <Link to="/login" className="btn btn-dark full-width">
                Return to Sign In
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
                  Email Address
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <button type="submit" className="btn btn-dark full-width" disabled={busy}>
                  {busy ? 'Sending Link...' : 'Send Reset Link'} {!busy && <ArrowUpRight size={15} />}
                </button>
              </form>

              <div className="auth-footer">
                <Link to="/login" className="back-link">
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
