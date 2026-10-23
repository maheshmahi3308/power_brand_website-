import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowUpRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // If already authenticated, redirect
  useEffect(() => {
    document.title = 'Sign In — FORME';
    if (!isLoading && isAuthenticated) {
      const from = location.state?.from?.pathname || '/account';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    if (!supabase) {
      toast('Supabase connection is not configured in environment.', 'error');
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) throw error;

      toast('Welcome back!', 'success');
      const from = location.state?.from?.pathname || '/account';
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Sign in error:', err);
      setErrorMsg(err.message || 'Invalid email or password.');
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
            <p className="eyebrow">CUSTOMER ACCESS</p>
            <h1>Welcome Back</h1>
            <p className="auth-desc">
              Sign in to view your submitted enquiries, track availability, and manage your wishlist.
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
              Email Address
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label>
              <div className="label-with-link">
                <span>Password</span>
                <Link to="/forgot-password" tabIndex={-1} className="form-sublink">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <button type="submit" className="btn btn-dark full-width" disabled={busy}>
              {busy ? 'Signing In...' : 'Sign In'} {!busy && <ArrowUpRight size={15} />}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account yet?{' '}
              <Link to="/register" className="auth-switch-link">Create Account</Link>
            </p>
            <p className="auth-help-note">
              You can also browse and enquire about products as a guest without signing in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
