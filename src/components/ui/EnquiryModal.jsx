import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { money, shortRef } from '../../lib/money';
import { CONTACT, productWhatsappUrl } from '../../lib/contact';
import Modal from './Modal';
import { imageFor } from './ProductCard';

const INITIAL_FORM = {
  name: '', email: '', phone: '',
  size: '', color: '', quantity: '1', message: '', consent: false,
};

export default function EnquiryModal({ product, open, onClose }) {
  const { isAuthenticated, user, profile } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(null); // { ref }

  // Reset when product changes
  React.useEffect(() => {
    if (open && product) {
      setForm({
        ...INITIAL_FORM,
        name: profile?.full_name || '',
        email: user?.email || '',
        size: product.sizes?.[0] || '',
        color: product.colors?.[0] || '',
      });
      setSuccess(null);
    }
  }, [open, product, profile, user]);

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return 'Please enter your name.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.';
    if (!isAuthenticated && !form.phone.trim()) return 'Phone number is required for guest enquiries.';
    if (!form.consent) return 'Please agree to be contacted.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast(err, 'error'); return; }
    if (!product || product.preview) {
      toast('This product is a preview. Publish it to accept enquiries.', 'error');
      return;
    }
    if (!supabase) { toast('Service is unavailable. Please contact us directly.', 'error'); return; }

    setBusy(true);
    try {
      const refCode = `ENQ-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const payload = {
        product_id: product.id,
        customer_name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        size: form.size || null,
        color: form.color || null,
        quantity: Math.max(1, Math.min(20, parseInt(form.quantity, 10) || 1)),
        message: form.message.trim() || null,
        consent: true,
        status: 'New',
        reference_code: refCode,
      };

      if (isAuthenticated && user) {
        payload.user_id = user.id;
      } else {
        // Guest enquiry — user_id stays null, validated by RLS
        payload.guest_name = form.name.trim();
        payload.guest_email = form.email.trim();
        payload.guest_phone = form.phone.trim() || null;
      }

      const { error } = await supabase.from('product_inquiries').insert(payload);
      if (error) throw error;

      setSuccess({ ref: refCode });
    } catch (e) {
      toast(e.message || 'Could not submit enquiry. Please try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!product) return null;

  return (
    <Modal open={open} onClose={onClose} title="Product Enquiry" size="lg">
      {success ? (
        /* ── Success screen ── */
        <div className="enquiry-success">
          <CheckCircle2 size={44} className="success-icon" />
          <h2>Enquiry Submitted!</h2>
          <p>Your reference number is:</p>
          <div className="enquiry-ref">{success.ref}</div>
          <p className="enquiry-success-desc">
            Thank you! Our team will review your enquiry and contact you to confirm availability,
            sizing, and pricing details. Please keep your reference number handy.
          </p>
          <div className="enquiry-contact-block">
            <p className="enquiry-contact-label">Need to follow up? Contact us directly:</p>
            <strong>{CONTACT.name}</strong>
            <div className="enquiry-contact-btns">
              <a href={CONTACT.phoneHref} className="btn btn-dark">
                <Phone size={15} /> {CONTACT.phone}
              </a>
              <a
                href={productWhatsappUrl(product.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
              >
                <MessageCircle size={15} /> WhatsApp
              </a>
            </div>
          </div>
          <button className="btn btn-light full-width" onClick={onClose}>
            Continue Browsing
          </button>
        </div>
      ) : (
        /* ── Enquiry form ── */
        <>
          <p className="eyebrow">PRODUCT ENQUIRY</p>
          <h2 className="modal-title">Let's make it yours.</h2>

          {/* Selected product preview */}
          <div className="enquiry-product-preview">
            <img src={imageFor(product)} alt={product.name} />
            <div>
              <span className="product-brand">{product.brand_name || product.brands?.name}</span>
              <strong>{product.name}</strong>
              <span>{money(product.sale_price || product.price)}</span>
            </div>
          </div>

          <p className="modal-desc">
            Tell us your preferences and we'll confirm availability, final price, and delivery
            details with you directly.
          </p>

          <form className="form" onSubmit={handleSubmit} noValidate>
            <div className="form-two">
              <label>
                Your name *
                <input required value={form.name} onChange={set('name')} placeholder="Full name" />
              </label>
              <label>
                Email address *
                <input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" />
              </label>
            </div>
            <label>
              Phone number {!isAuthenticated && <span className="required-star">*</span>}
              {isAuthenticated && <span className="optional"> (optional)</span>}
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="Phone or WhatsApp number"
                required={!isAuthenticated}
              />
            </label>
            <div className="form-two">
              {product.sizes?.length > 0 && (
                <label>
                  Preferred size
                  <select value={form.size} onChange={set('size')}>
                    <option value="">Select size</option>
                    {product.sizes.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
              )}
              {product.colors?.length > 0 && (
                <label>
                  Preferred color
                  <select value={form.color} onChange={set('color')}>
                    <option value="">Select color</option>
                    {product.colors.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
              )}
            </div>
            <label>
              Quantity
              <input type="number" min="1" max="20" required value={form.quantity} onChange={set('quantity')} />
            </label>
            <label>
              Message <span className="optional">(optional)</span>
              <textarea
                rows="3"
                value={form.message}
                onChange={set('message')}
                placeholder="Any specific requirements, color preferences, or questions…"
              />
            </label>
            <label className="check-label">
              <input type="checkbox" checked={form.consent} onChange={set('consent')} required />
              I agree to be contacted by the team regarding this enquiry. *
            </label>
            <button className="btn btn-dark full-width" disabled={busy}>
              {busy ? 'Submitting…' : 'Submit Enquiry'} {!busy && <ArrowUpRight size={15} />}
            </button>
            <p className="form-note">
              No payment required. We'll contact you to confirm details before any purchase.
            </p>
          </form>
        </>
      )}
    </Modal>
  );
}
