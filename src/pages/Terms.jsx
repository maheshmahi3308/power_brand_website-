import React, { useEffect } from 'react';
import { CONTACT } from '../lib/contact';

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms & Conditions — FORME';
  }, []);

  return (
    <div className="page policy-page">
      <div className="container">
        <div className="page-header">
          <div>
            <p className="eyebrow">LEGAL &amp; COMPLIANCE</p>
            <h1>Terms and Conditions</h1>
            <p className="page-subtitle">Last updated: October 2026</p>
          </div>
        </div>

        <div className="policy-prose">
          <h2>1. Overview</h2>
          <p>
            By accessing or using the FORME website, you acknowledge and agree to these Terms and Conditions. These terms govern the browsing of catalogue products and the submission of product enquiries.
          </p>

          <h2>2. Enquiry-Based Purchasing Model</h2>
          <p>
            The display of products, brands, or pricing on FORME does not constitute a legally binding immediate commercial sale. All submissions through "Enquire About This Product" constitute an initial request for information and availability confirmation.
          </p>
          <ul>
            <li>No contracts or financial obligations are established until our team confirms availability and you explicitly agree to purchase.</li>
            <li>No online payment gateways or card processing functions exist on this website.</li>
          </ul>

          <h2>3. Product Information &amp; Brand Identifiers</h2>
          <p>
            Brand names, logos, and trademarks shown on FORME belong to their respective brand owners. FORME presents curated selections of branded clothing, footwear, and accessories. We strive for accurate pricing and imagery, but physical availability remains subject to actual supplier stock.
          </p>

          <h2>4. User Conduct</h2>
          <p>
            Visitors agree to submit accurate contact information when filling out enquiry forms. Automated spam submissions, scraping, or misuse of enquiry forms is strictly prohibited.
          </p>

          <h2>5. Contact Information</h2>
          <p>
            For any clarifications regarding these Terms, contact <strong>{CONTACT.name}</strong> at <strong>{CONTACT.phone}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
