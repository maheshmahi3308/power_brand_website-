import React, { useEffect } from 'react';
import { CONTACT } from '../lib/contact';

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy — FORME';
  }, []);

  return (
    <div className="page policy-page">
      <div className="container">
        <div className="page-header">
          <div>
            <p className="eyebrow">LEGAL &amp; COMPLIANCE</p>
            <h1>Privacy Policy</h1>
            <p className="page-subtitle">Last updated: October 2026</p>
          </div>
        </div>

        <div className="policy-prose">
          <h2>1. Introduction</h2>
          <p>
            FORME operates an enquiry-based branded fashion catalogue. We are committed to safeguarding the personal privacy of our visitors and registered customers. This Privacy Policy outlines what information we collect, how it is used, and how it is secured.
          </p>

          <h2>2. Information We Collect</h2>
          <p>
            When you browse FORME, you may do so anonymously without registering an account. When submitting an enquiry or registering an account, we may collect:
          </p>
          <ul>
            <li><strong>Contact Information</strong>: Full name, email address, phone/WhatsApp number.</li>
            <li><strong>Enquiry Data</strong>: Preferred size, color, product interest, and custom requirements.</li>
            <li><strong>Account Credentials</strong>: Encrypted email and password (managed securely by Supabase Authentication). Plaintext passwords are never stored or accessible to our team.</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>
            We collect your contact details solely for:
          </p>
          <ul>
            <li>Responding to your product enquiries and confirming size and availability.</li>
            <li>Coordinating delivery and order fulfillment directly with our team.</li>
            <li>Allowing authenticated customers to track their submitted enquiries in the account dashboard.</li>
          </ul>
          <p>
            We do not sell, rent, or trade your personal information to third-party marketing companies.
          </p>

          <h2>4. Data Security</h2>
          <p>
            All user sessions and database records are governed by PostgreSQL Row Level Security (RLS) policies. Only authorized administrators can review operational catalogue data and incoming enquiries.
          </p>

          <h2>5. Contact for Privacy Matters</h2>
          <p>
            If you have questions or wish to request deletion of your account or submitted enquiries, contact our representative:
          </p>
          <p>
            <strong>{CONTACT.name}</strong><br />
            Phone: {CONTACT.phone}<br />
            Website: FORME Fashion Store
          </p>
        </div>
      </div>
    </div>
  );
}
