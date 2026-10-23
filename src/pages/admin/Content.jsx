import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { CONTACT } from '../../lib/contact';

export default function AdminContent() {
  const toast = useToast();

  const [announcement, setAnnouncement] = useState('COMPLIMENTARY STYLE ADVICE · CONTACT US BEFORE YOU BUY · FREE ENQUIRY SERVICE');
  const [headline, setHeadline] = useState('Your Style. Your Brands. Better Choices.');
  const [subtext, setSubtext] = useState('Discover branded fashion, explore your favorite styles, and contact our team to enquire about availability and pricing.');
  const [contactName, setContactName] = useState(CONTACT.name);
  const [contactPhone, setContactPhone] = useState(CONTACT.phone);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Site Content & Banners — FORME Admin';
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (!error && data) {
        data.forEach(item => {
          if (item.key === 'announcement' && item.value) setAnnouncement(typeof item.value === 'string' ? item.value : JSON.stringify(item.value));
          if (item.key === 'hero' && item.value) {
            if (item.value.headline) setHeadline(item.value.headline);
            if (item.value.subtext) setSubtext(item.value.subtext);
          }
          if (item.key === 'contact' && item.value) {
            if (item.value.name) setContactName(item.value.name);
            if (item.value.phone) setContactPhone(item.value.phone);
          }
        });
      }
    } catch (err) {
      console.warn('Could not read site_settings table (run migration 001_extend_schema.sql):', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);

    try {
      if (!supabase) {
        toast('Supabase connection unavailable.', 'error');
        return;
      }

      const updates = [
        { key: 'announcement', value: announcement, updated_at: new Date().toISOString() },
        { key: 'hero', value: { headline, subtext }, updated_at: new Date().toISOString() },
        { key: 'contact', value: { name: contactName, phone: contactPhone }, updated_at: new Date().toISOString() }
      ];

      for (const item of updates) {
        await supabase
          .from('site_settings')
          .upsert(item);
      }

      toast('Store content and settings saved successfully.', 'success');
    } catch (err) {
      toast(err.message || 'Error saving settings.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">STORE CUSTOMIZATION</p>
          <h1>Website Content Management</h1>
          <p className="page-subtitle">Configure homepage copy, promotional announcements, and verified contact details.</p>
        </div>
      </div>

      <div className="admin-card">
        <form className="form" onSubmit={handleSave}>
          <div className="form-section-title">
            <h3>Announcement Banner</h3>
            <p className="small-muted">Appears at the very top of every storefront page.</p>
          </div>

          <label>
            Banner Text
            <input
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Announcement text..."
            />
          </label>

          <div className="form-section-title mt-6">
            <h3>Homepage Hero Banner</h3>
            <p className="small-muted">Main headline and supporting copy shown above the fold.</p>
          </div>

          <label>
            Headline
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Your Style. Your Brands. Better Choices."
            />
          </label>

          <label>
            Supporting Text
            <textarea
              rows="3"
              value={subtext}
              onChange={(e) => setSubtext(e.target.value)}
              placeholder="Supporting copy..."
            />
          </label>

          <div className="form-section-title mt-6">
            <h3>Primary Business Contact</h3>
            <p className="small-muted">Official contact person displayed across buttons, footer, and enquiry workflows.</p>
          </div>

          <div className="form-two">
            <label>
              Contact Name
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Y. Ramesh"
              />
            </label>
            <label>
              Contact Phone (10 digits)
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="6302016103"
              />
            </label>
          </div>

          <div className="admin-form-actions mt-6">
            <button type="submit" className="btn btn-dark" disabled={busy}>
              <Save size={15} /> {busy ? 'Saving...' : 'Save Website Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
