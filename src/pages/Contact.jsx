import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, MessageCircle, Mail, Clock, MapPin,
  CheckCircle2, ArrowUpRight, Send, AlertCircle
} from 'lucide-react';
import { CONTACT, whatsappUrl } from '../lib/contact';
import { useToast } from '../context/ToastContext';

export default function Contact() {
  const toast = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = 'Contact Us — FORME';
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast('Please fill out the required fields.', 'error');
      return;
    }

    setSubmitted(true);
    toast('Your message has been received! Our team will contact you shortly.', 'success');
  };

  return (
    <div className="page contact-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">REACH OUT</p>
            <h1>Contact Us</h1>
            <p className="page-subtitle">
              We are here to assist with product enquiries, sizing details, availability, and delivery requests.
            </p>
          </div>
        </div>

        <div className="contact-grid">
          {/* Contact Details Card */}
          <div className="contact-info-card">
            <span className="contact-badge">PRIMARY CONTACT</span>
            <h2 className="contact-person-heading">{CONTACT.name}</h2>
            <p className="contact-person-sub">Store Manager &amp; Brand Consultant</p>

            <p className="contact-desc">
              For immediate answers on product availability, stock status, or orders, contact us via phone or WhatsApp.
            </p>

            <div className="contact-button-stack">
              <a href={CONTACT.phoneHref} className="btn btn-dark full-width">
                <Phone size={16} /> Call {CONTACT.phone}
              </a>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp full-width"
              >
                <MessageCircle size={16} /> WhatsApp Enquiry
              </a>
            </div>

            <div className="contact-guidelines">
              <h3>Direct Support</h3>
              <ul>
                <li><strong>Phone:</strong> {CONTACT.phone}</li>
                <li><strong>WhatsApp:</strong> +{CONTACT.whatsappNumber}</li>
                <li><strong>Enquiries:</strong> Submit directly on any product page or reach out using the buttons above.</li>
              </ul>
            </div>

            <div className="contact-note-box">
              <p>
                <strong>Need a custom brand request?</strong> Send us a message on WhatsApp with the brand and model you are looking for.
              </p>
            </div>
          </div>

          {/* Quick Message Form */}
          <div className="contact-form-card">
            <h2>Send a Quick Message</h2>
            <p className="form-subtext">
              Have a general query? Leave your details and we will respond as soon as possible.
            </p>

            {submitted ? (
              <div className="form-success-state">
                <CheckCircle2 size={40} className="success-icon" />
                <h3>Thank You, {formData.name}!</h3>
                <p>
                  Your message has been sent. Y. Ramesh will get back to you promptly. For faster assistance, feel free to call or WhatsApp directly.
                </p>
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: '', email: '', phone: '', message: '' });
                  }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form className="form" onSubmit={handleSubmit}>
                <label>
                  Your Name *
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </label>

                <div className="form-two">
                  <label>
                    Email Address *
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </label>
                  <label>
                    Phone / WhatsApp
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </label>
                </div>

                <label>
                  Your Message or Product Query *
                  <textarea
                    rows="4"
                    required
                    placeholder="Which brand, product, size, or style are you inquiring about?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </label>

                <button type="submit" className="btn btn-dark full-width">
                  Send Message <Send size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
