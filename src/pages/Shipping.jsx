import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, RotateCcw, Clock, ShieldCheck, Phone, MessageCircle } from 'lucide-react';
import { CONTACT, whatsappUrl } from '../lib/contact';

export default function Shipping() {
  useEffect(() => {
    document.title = 'Shipping & Returns Information — FORME';
  }, []);

  return (
    <div className="page shipping-page">
      <div className="container">
        <div className="page-header">
          <div>
            <p className="eyebrow">ORDER FULFILLMENT</p>
            <h1>Shipping &amp; Returns Information</h1>
            <p className="page-subtitle">
              Clear, transparent policies for our enquiry-based fashion orders.
            </p>
          </div>
        </div>

        <div className="shipping-grid">
          <div className="shipping-content">
            <section className="policy-block">
              <div className="policy-header">
                <Truck size={22} />
                <h2>Shipping &amp; Delivery Process</h2>
              </div>
              <p>
                Because FORME operates on an enquiry-first model, we do not auto-charge or immediately ship without customer consultation.
              </p>
              <ul>
                <li>
                  <strong>Step 1: Enquiry Submission</strong> — Customer submits a product enquiry with desired size and color.
                </li>
                <li>
                  <strong>Step 2: Availability &amp; Address Confirmation</strong> — Our team verifies real-time stock and contacts you to confirm your exact delivery destination and preferred shipping mode.
                </li>
                <li>
                  <strong>Step 3: Order Conversion &amp; Dispatch</strong> — Once confirmed, items are inspected for quality and dispatched within 1–3 business days.
                </li>
                <li>
                  <strong>Step 4: Tracking Updates</strong> — Consignment tracking details are provided directly to you via WhatsApp or SMS.
                </li>
              </ul>
            </section>

            <section className="policy-block">
              <div className="policy-header">
                <RotateCcw size={22} />
                <h2>Inspection &amp; Return Guidelines</h2>
              </div>
              <p>
                We take special care to check the condition, labels, and exact sizing of every piece before it leaves our facility.
              </p>
              <ul>
                <li>
                  <strong>Sizing Verification</strong>: Sizing charts and measurements are reviewed with you prior to dispatch to prevent fitting mismatches.
                </li>
                <li>
                  <strong>Transit Damage or Defects</strong>: In the unlikely event that a parcel arrives with physical defects or damage, please take photos and contact Y. Ramesh within 24–48 hours of receipt.
                </li>
                <li>
                  <strong>Exchange Resolution</strong>: Eligible exchanges or replacements are handled directly with our team on a case-by-case basis.
                </li>
              </ul>
            </section>

            <section className="policy-block">
              <div className="policy-header">
                <ShieldCheck size={22} />
                <h2>Need Direct Assistance?</h2>
              </div>
              <p>
                All fulfillment and dispatch inquiries are coordinated directly by <strong>{CONTACT.name}</strong>.
              </p>
              <div className="shipping-actions">
                <a href={CONTACT.phoneHref} className="btn btn-dark">
                  <Phone size={15} /> Call {CONTACT.phone}
                </a>
                <a
                  href={whatsappUrl('Hello Y. Ramesh, I have a query regarding shipping and delivery for my order.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                >
                  <MessageCircle size={15} /> WhatsApp Support
                </a>
              </div>
            </section>
          </div>

          <div className="shipping-sidebar">
            <div className="highlight-card">
              <h3>Fast Summary</h3>
              <div className="highlight-item">
                <Clock size={16} />
                <div>
                  <strong>Dispatch Timeline</strong>
                  <p>1–3 business days post enquiry confirmation</p>
                </div>
              </div>
              <div className="highlight-item">
                <Truck size={16} />
                <div>
                  <strong>Pan-India Delivery</strong>
                  <p>Coordinated via reliable courier partners</p>
                </div>
              </div>
              <div className="highlight-item">
                <ShieldCheck size={16} />
                <div>
                  <strong>Pre-Shipment Quality Check</strong>
                  <p>Inspected for sizing, fabric, and authenticity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
