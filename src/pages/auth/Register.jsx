import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, AlertCircle, ShieldCheck, User, Lock } from 'lucide-react';
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

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer'); // 'customer' | 'admin'
  const [adminPasscode, setAdminPasscode] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [verifyNotice, setVerifyNotice] = useState(false);

  useEffect(() => {
    document.title = 'Create Account — FORME';
    if (!isLoading && isAuthenticated) {
      navigate(isAdmin ? '/admin' : '/account', { replace: true });
    }
  }, [isAuthenticated, isLoading, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    // Validate Admin Passcode if registering as Administrator
    if (role === 'admin') {
      if (!adminPasscode.trim()) {
        setErrorMsg('Admin Security Passcode is required to register an Administrator account.');
        return;
      }
      if (!isValidPasscode(adminPasscode)) {
        setErrorMsg('Invalid Admin Security Passcode. Passcode: FORME@ADMIN#2026');
        return;
      }
    }

    if (!supabase) {
      toast('Supabase connection is not configured in environment.', 'error');
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: role,
            admin_code: role === 'admin' ? adminPasscode.trim() : ''
          }
        }
      });

      if (error) throw error;

      if (data?.session) {
        toast(`Account created with ${role === 'admin' ? 'Administrator' : 'Customer'} role!`, 'success');
        if (role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/account', { replace: true });
        }
      } else {
        // Email confirmation is enabled in Supabase
        setVerifyNotice(true);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Could not complete registration.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="container">
        <div className="auth-card register-auth-card">
          <div className="auth-header">
            <Link to="/" className="wordmark">FORME<span>®</span></Link>
            <p className="eyebrow">NEW REGISTRATION</p>
            <h1>Create an Account</h1>
            <p className="auth-desc">
              Select your role, create an account, and get started with FORME.
            </p>
          </div>

          {verifyNotice ? (
            <div className="form-success-state">
              <CheckCircle2 size={44} className="success-icon" />
              <h2>Verify Your Email</h2>
              <p>
                A verification link has been sent to <strong>{email}</strong>. Once confirmed, you can log in as <strong>{role === 'admin' ? 'Administrator' : 'Customer'}</strong>.
              </p>
              <Link to={role === 'admin' ? '/admin/login' : '/login'} className="btn btn-dark full-width">
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
                {/* Role Selector */}
                <div className="role-selection-group">
                  <span className="role-group-label">Select Account Role *</span>
                  <div className="role-options-grid">
                    <button
                      type="button"
                      className={`role-option-card ${role === 'customer' ? 'active' : ''}`}
                      onClick={() => setRole('customer')}
                    >
                      <div className="role-option-header">
                        <User size={18} />
                        <strong>Customer / User</strong>
                      </div>
                      <p>Browse pieces, submit product enquiries &amp; track your orders</p>
                    </button>

                    <button
                      type="button"
                      className={`role-option-card ${role === 'admin' ? 'active' : ''}`}
                      onClick={() => setRole('admin')}
                    >
                      <div className="role-option-header">
                        <ShieldCheck size={18} />
                        <strong>Administrator</strong>
                      </div>
                      <p>Access Admin Portal, manage products, brands &amp; respond to enquiries</p>
                    </button>
                  </div>
                </div>

                {/* Secret passcode input for Admin */}
                {role === 'admin' && (
                  <div className="admin-passcode-field">
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
                        Master Passcode: <strong>FORME@ADMIN#2026</strong>
                      </span>
                    </label>
                  </div>
                )}

                <label>
                  Full Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </label>

                <label>
                  Email Address *
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>

                <label>
                  Phone / WhatsApp Number <span className="optional">(optional)</span>
                  <input
                    type="tel"
                    placeholder="Your contact number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>

                <div className="form-two">
                  <label>
                    Password (min 6 chars) *
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
                    Confirm Password *
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </label>
                </div>

                <div className="auth-terms-note">
                  <ShieldCheck size={14} />
                  <span>
                    Account will be provisioned with <strong>{role === 'admin' ? 'Administrator' : 'Customer'}</strong> privileges.
                  </span>
                </div>

                <button type="submit" className="btn btn-dark full-width" disabled={busy}>
                  {busy ? 'Creating Account...' : `Register as ${role === 'admin' ? 'Administrator' : 'Customer'}`} {!busy && <ArrowUpRight size={15} />}
                </button>
              </form>

              <div className="auth-footer">
                <p>
                  Already have an account?{' '}
                  <Link to="/login" className="auth-switch-link">Sign In</Link>
                </p>
                {role === 'admin' && (
                  <p className="admin-alt-note">
                    Admins can also sign in directly at the <Link to="/admin/login">Admin Login Portal</Link>.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
