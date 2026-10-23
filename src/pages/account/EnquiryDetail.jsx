import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, MessageCircle, Clock, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { shortRef } from '../../lib/money';
import { CONTACT, productWhatsappUrl } from '../../lib/contact';

const STATUS_COLORS = {
  'New': 'status-new',
  'Reviewing': 'status-reviewing',
  'Availability Confirmed': 'status-confirmed',
  'Awaiting Customer Response': 'status-waiting',
  'Converted to Order': 'status-converted',
  'Closed': 'status-closed',
  'Cancelled': 'status-cancelled',
};

const STATUS_DESCRIPTIONS = {
  'New': 'Your enquiry has been received. Our team will review it shortly.',
  'Reviewing': 'Our team is reviewing your enquiry and checking availability.',
  'Availability Confirmed': 'Great news! The product is available. Our team will contact you soon to discuss pricing and delivery.',
  'Awaiting Customer Response': 'We\'ve reached out and are waiting for your response. Please check your phone or WhatsApp.',
  'Converted to Order': 'Your enquiry has been converted to an order. Delivery details will be confirmed separately.',
  'Closed': 'This enquiry has been closed.',
  'Cancelled': 'This enquiry has been cancelled.',
};

export default function EnquiryDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Enquiry Details — FORME';
    if (!supabase || !user || !id) return;

    (async () => {
      setLoading(true);
      // RLS ensures customers can only see their own enquiries
      const { data, error: err } = await supabase
        .from('product_inquiries')
        .select(`
          id, reference_code, status, created_at, updated_at,
          customer_name, email, phone, size, color, quantity, message, consent,
          products(id, name, image_url, brand_id, brands(name))
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (err) setError(err.message);
      else if (!data) setError('Enquiry not found or access denied.');
      else setEnquiry(data);
      setLoading(false);
    })();
  }, [id, user]);

  if (loading) return <div className="page-loading"><span className="spinner" /></div>;
  if (error) return (
    <div className="page"><div className="container">
      <div className="error-state">
        <Package size={36} />
        <h2>Not Found</h2>
        <p>{error}</p>
        <Link to="/account/enquiries" className="btn btn-dark">Back to Enquiries</Link>
      </div>
    </div></div>
  );

  const ref = enquiry.reference_code || shortRef(enquiry.id);
  const productName = enquiry.products?.name;

  return (
    <div className="page account-page">
      <div className="container">
        <Link to="/account/enquiries" className="back-link">
          <ArrowLeft size={15} /> Back to Enquiries
        </Link>

        <div className="enquiry-detail-grid">
          {/* Main detail */}
          <div className="enquiry-detail-main">
            <div className="enquiry-detail-header">
              <p className="eyebrow">ENQUIRY DETAILS</p>
              <h1>Ref: {ref}</h1>
              <span className={`status-chip status-lg ${STATUS_COLORS[enquiry.status] || ''}`}>
                {enquiry.status}
              </span>
            </div>

            <p className="status-description">{STATUS_DESCRIPTIONS[enquiry.status]}</p>

            {/* Product */}
            {enquiry.products && (
              <div className="detail-section">
                <h2 className="detail-section-title">Product</h2>
                <div className="enquiry-product-card">
                  {enquiry.products.image_url && (
                    <img src={enquiry.products.image_url} alt={productName} />
                  )}
                  <div>
                    <span className="product-brand">{enquiry.products.brands?.name}</span>
                    <strong>{productName}</strong>
                    <Link
                      to={`/products/${enquiry.products.id}`}
                      className="text-link-sm"
                    >
                      View product
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Enquiry details */}
            <div className="detail-section">
              <h2 className="detail-section-title">Your Request</h2>
              <div className="detail-grid-2">
                {enquiry.size && <div className="detail-field"><span>Size</span><strong>{enquiry.size}</strong></div>}
                {enquiry.color && <div className="detail-field"><span>Color</span><strong>{enquiry.color}</strong></div>}
                <div className="detail-field"><span>Quantity</span><strong>{enquiry.quantity}</strong></div>
              </div>
              {enquiry.message && (
                <div className="detail-field">
                  <span>Your message</span>
                  <p className="detail-message">{enquiry.message}</p>
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="detail-section">
              <h2 className="detail-section-title">Timeline</h2>
              <div className="detail-timeline">
                <div className="timeline-item">
                  <Clock size={14} />
                  <div>
                    <span>Submitted</span>
                    <strong>{new Date(enquiry.created_at).toLocaleString('en-IN')}</strong>
                  </div>
                </div>
                {enquiry.updated_at !== enquiry.created_at && (
                  <div className="timeline-item">
                    <Clock size={14} />
                    <div>
                      <span>Last updated</span>
                      <strong>{new Date(enquiry.updated_at).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="enquiry-detail-sidebar">
            <div className="contact-card">
              <p className="eyebrow">NEED HELP?</p>
              <h3>Contact Us Directly</h3>
              <p>For urgent queries, reach out to {CONTACT.name} directly:</p>
              <a href={CONTACT.phoneHref} className="btn btn-dark full-width">
                <Phone size={15} /> Call {CONTACT.phone}
              </a>
              <a
                href={productWhatsappUrl(productName || 'your enquiry')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp full-width"
              >
                <MessageCircle size={15} /> WhatsApp Enquiry
              </a>
              <p className="contact-note">
                Please mention your reference number <strong>{ref}</strong> when contacting us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
