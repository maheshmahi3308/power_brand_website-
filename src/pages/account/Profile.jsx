import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { ArrowUpRight, User } from 'lucide-react';

export default function AccountProfile() {
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    document.title = 'My Profile — FORME';
    if (profile) {
      setForm({ full_name: profile.full_name || '', phone: profile.phone || '' });
    }
  }, [profile]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!supabase || !user) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: form.full_name.trim(), phone: form.phone.trim() })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast('Profile updated successfully.', 'success');
    } catch (err) {
      toast(err.message || 'Could not save profile.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPw.length < 8) { toast('New password must be at least 8 characters.', 'error'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast('Passwords do not match.', 'error'); return; }
    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
      if (error) throw error;
      toast('Password changed successfully.', 'success');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      toast(err.message || 'Could not change password.', 'error');
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="page account-page">
      <div className="container">
        <div className="page-header">
          <div>
            <p className="eyebrow">MY ACCOUNT</p>
            <h1>My Profile</h1>
          </div>
          <div className="account-avatar-lg">
            <User size={32} />
          </div>
        </div>

        <div className="profile-grid">
          {/* Profile details */}
          <div className="profile-section card">
            <h2>Personal Information</h2>
            <p className="section-desc">Update your name and contact number.</p>
            <form className="form" onSubmit={handleProfileSave}>
              <label>
                Full Name
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Your full name"
                  required
                />
              </label>
              <label>
                Email Address
                <input value={user?.email || ''} disabled className="input-disabled" />
                <span className="field-note">Email cannot be changed here.</span>
              </label>
              <label>
                Phone Number
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 XXXXX XXXXX"
                />
              </label>
              <button className="btn btn-dark" disabled={busy}>
                {busy ? 'Saving…' : 'Save Changes'} {!busy && <ArrowUpRight size={14} />}
              </button>
            </form>
          </div>

          {/* Password change */}
          <div className="profile-section card">
            <h2>Change Password</h2>
            <p className="section-desc">Choose a strong password of at least 8 characters.</p>
            <form className="form" onSubmit={handlePasswordChange}>
              <label>
                New Password
                <input
                  type="password"
                  minLength={8}
                  required
                  value={pwForm.newPw}
                  onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
                  placeholder="At least 8 characters"
                />
              </label>
              <label>
                Confirm New Password
                <input
                  type="password"
                  required
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat new password"
                />
              </label>
              <button className="btn btn-dark" disabled={pwBusy}>
                {pwBusy ? 'Updating…' : 'Update Password'} {!pwBusy && <ArrowUpRight size={14} />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
