import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MessageCircle, Instagram, Facebook, Twitter } from 'lucide-react';
import { CONTACT, whatsappUrl } from '../../lib/contact';

const SHOP_LINKS = [
  { label: 'Shop All', to: '/shop' },
  { label: "Men's Fashion", to: '/men' },
  { label: "Women's Fashion", to: '/women' },
  { label: 'Small Kids', to: '/kids' },
  { label: 'New Arrivals', to: '/new-arrivals' },
  { label: 'Offers', to: '/offers' },
];

const INFO_LINKS = [
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Shipping & Returns', to: '/shipping' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms & Conditions', to: '/terms' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-grid">
        {/* Brand column */}
        <div className="footer-brand">
          <Link to="/" className="wordmark footer-wordmark">
            FORME<span>®</span>
          </Link>
          <p className="footer-tagline">
            Branded fashion. A smarter way to discover. Browse freely, enquire personally.
          </p>
          {/* Contact */}
          <div className="footer-contact">
            <p className="footer-contact-label">Contact Person</p>
            <p className="footer-contact-name">{CONTACT.name}</p>
            <div className="footer-contact-actions">
              <a href={CONTACT.phoneHref} className="footer-contact-btn btn-call">
                <Phone size={14} /> {CONTACT.phone}
              </a>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-btn btn-whatsapp"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Shop links */}
        <div className="footer-col">
          <h3 className="footer-col-title">Shop</h3>
          <ul>
            {SHOP_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Info links */}
        <div className="footer-col">
          <h3 className="footer-col-title">Information</h3>
          <ul>
            {INFO_LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Account links */}
        <div className="footer-col">
          <h3 className="footer-col-title">My Account</h3>
          <ul>
            <li><Link to="/login">Sign In</Link></li>
            <li><Link to="/register">Create Account</Link></li>
            <li><Link to="/account/enquiries">My Enquiries</Link></li>
            <li><Link to="/account/wishlist">Wishlist</Link></li>
            <li><Link to="/account/profile">My Profile</Link></li>
          </ul>
          <div className="footer-social">
            <a href="#" aria-label="Instagram" rel="noopener noreferrer">
              <Instagram size={18} />
            </a>
            <a href="#" aria-label="Facebook" rel="noopener noreferrer">
              <Facebook size={18} />
            </a>
            <a href="#" aria-label="Twitter / X" rel="noopener noreferrer">
              <Twitter size={18} />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} FORME. All rights reserved.</span>
        <span className="footer-bottom-right">
          <Link to="/privacy">Privacy</Link>
          <span>·</span>
          <Link to="/terms">Terms</Link>
          <span>·</span>
          <Link to="/shipping">Shipping</Link>
        </span>
      </div>
    </footer>
  );
}
