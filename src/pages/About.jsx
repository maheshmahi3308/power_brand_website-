import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ShieldCheck, Heart, Sparkles, Phone, MessageCircle } from 'lucide-react';
import { CONTACT, whatsappUrl } from '../lib/contact';

export default function About() {
  useEffect(() => {
    document.title = 'About Us — FORME Fashion';
  }, []);

  return (
    <div className="page about-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <p className="eyebrow">OUR PHILOSOPHY</p>
            <h1>Style, On Your Terms.</h1>
            <p className="page-subtitle">
              A thoughtful approach to branded fashion that prioritizes verification, personal guidance, and transparent pricing.
            </p>
          </div>
        </div>

        {/* Narrative Section */}
        <div className="about-grid">
          <div className="about-visual">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85"
              alt="Curated branded fashion showroom"
              loading="lazy"
            />
            <div className="about-badge">
              <span>ESTABLISHED ON TRUST</span>
              <strong>FORME EDIT</strong>
            </div>
          </div>

          <div className="about-content">
            <h2>Why We Built an Enquiry-First Fashion Store</h2>
            <p>
              Traditional online shopping often feels disconnected. Customers deal with sizing ambiguity, unexpected inventory stockouts after paying, and impersonal automated support.
            </p>
            <p>
              At <strong>FORME</strong>, we do things differently. We curate popular branded clothing, footwear, and accessories at accessible prices. But instead of an automated cart, every order begins with a conversation.
            </p>
            <p>
              When you enquire about a product, our store team personally checks current stock, examines sizing recommendations with you, and guarantees that what you receive is exactly what you envisioned.
            </p>

            <div className="values-list">
              <div className="value-item">
                <ShieldCheck size={20} className="value-icon" />
                <div>
                  <strong>No Premature Payments</strong>
                  <p>You never pay before your size, color preference, and product availability are confirmed.</p>
                </div>
              </div>

              <div className="value-item">
                <Heart size={20} className="value-icon" />
                <div>
                  <strong>Personalized Attention</strong>
                  <p>Direct contact with Y. Ramesh for any queries, styling tips, or special requests.</p>
                </div>
              </div>

              <div className="value-item">
                <Sparkles size={20} className="value-icon" />
                <div>
                  <strong>Curated Brand Selection</strong>
                  <p>We hand-select items from recognizable labels so you can upgrade your wardrobe with confidence.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Store Manager & Contact Feature */}
        <div className="about-contact-section">
          <div className="about-contact-card">
            <p className="eyebrow">DIRECT CONTACT</p>
            <h2>Meet Your Store Representative</h2>
            <p>
              Have a question about an item or seeking a specific style? Reach out to <strong>{CONTACT.name}</strong> directly.
            </p>
            <div className="about-contact-actions">
              <a href={CONTACT.phoneHref} className="btn btn-dark">
                <Phone size={15} /> Call {CONTACT.phone}
              </a>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
              >
                <MessageCircle size={15} /> Chat on WhatsApp
              </a>
              <Link to="/shop" className="btn btn-outline">
                Explore The Collection <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
