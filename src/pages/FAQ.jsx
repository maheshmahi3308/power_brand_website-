import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Phone, MessageCircle, HelpCircle, ArrowUpRight } from 'lucide-react';
import { CONTACT, whatsappUrl } from '../lib/contact';

const FAQS = [
  {
    q: 'How does purchasing work on FORME?',
    a: 'Instead of an automated shopping cart with immediate checkout, FORME operates on a verified product enquiry model. You browse our catalogue, choose the piece you like, select your preferred size and color, and tap "Enquire". Our team verifies real-time availability and contacts you to confirm pricing, delivery address, and payment options before dispatch.'
  },
  {
    q: 'Can I browse and submit enquiries without creating an account?',
    a: 'Yes! Visitors can explore the complete public catalogue and submit product enquiries as a guest. When you submit as a guest, you receive a unique enquiry reference ID (e.g. ENQ-XXXXXX) to track your request. If you prefer to have all your enquiries saved in one central place, you can register for a free customer account.'
  },
  {
    q: 'Why is there no direct "Add to Cart" or payment button?',
    a: 'Because we deal in high-demand, popular branded fashion, physical inventory can move quickly. Direct automated checkout often leads to order cancellations, sizing mismatches, or stock delays. By reviewing each enquiry first, we guarantee that the piece in your specific size and color is available before taking payment.'
  },
  {
    q: 'Who will contact me after I submit an enquiry?',
    a: `Your enquiry is directly managed by our store representative, ${CONTACT.name}. You can also reach out to him immediately after submitting your enquiry at ${CONTACT.phone} or via WhatsApp.`
  },
  {
    q: 'Are the prices listed on the website final?',
    a: 'Listed prices represent our current selling prices and applicable promotional discounts. In cases of special requests or combined shipping, the team will confirm the final amount with you.'
  },
  {
    q: 'What brands do you feature in the store?',
    a: 'Our collection includes popular lifestyle, sports, and casual labels such as NIKE, ADIDAS, LEVI’S, PUMA, ZARA, TOMMY HILFIGER, and more. Availability varies based on curated stock.'
  },
  {
    q: 'How long does delivery take after an enquiry is confirmed?',
    a: 'Once availability is confirmed and the order is finalized with our team, standard dispatch typically takes 1–3 business days. Delivery timelines depend on your shipping location in India.'
  },
  {
    q: 'Can I request a brand or piece not shown on the website?',
    a: 'Yes! Reach out to Y. Ramesh via WhatsApp with photos or references of the style you are looking for. Our team will verify if we can source it for you.'
  },
  {
    q: 'How can I track the status of my enquiry?',
    a: 'If you have an account, log in and visit "My Enquiries" under your dashboard. You will see live statuses: New, Reviewing, Availability Confirmed, Awaiting Customer Response, Converted to Order, or Closed. If you submitted as a guest, simply quote your reference ID when contacting Y. Ramesh.'
  },
  {
    q: 'What is your return or exchange policy?',
    a: 'Because we confirm exact sizing and piece details with you before shipping, sizing issues are rare. If an item arrives damaged or defective, notify us within 24–48 hours of delivery for resolution.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    document.title = 'Frequently Asked Questions — FORME';
  }, []);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="page faq-page">
      <div className="container">
        <div className="page-header">
          <div>
            <p className="eyebrow">HELP &amp; GUIDANCE</p>
            <h1>Frequently Asked Questions</h1>
            <p className="page-subtitle">
              Everything you need to know about browsing, inquiring, sizing, and order processing.
            </p>
          </div>
        </div>

        <div className="faq-layout">
          <div className="faq-list">
            {FAQS.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    className="faq-question-btn"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.q}</span>
                    <ChevronDown size={18} className="faq-arrow" />
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="faq-sidebar">
            <div className="faq-help-box">
              <HelpCircle size={28} />
              <h3>Still have questions?</h3>
              <p>
                Speak directly with <strong>{CONTACT.name}</strong> to clarify any sizing, order, or product enquiry questions.
              </p>
              <div className="faq-sidebar-buttons">
                <a href={CONTACT.phoneHref} className="btn btn-dark full-width">
                  <Phone size={15} /> Call {CONTACT.phone}
                </a>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp full-width"
                >
                  <MessageCircle size={15} /> WhatsApp Us
                </a>
                <Link to="/contact" className="btn btn-outline full-width">
                  Contact Form <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
