import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { shortRef } from '../../lib/money';

const STATUS_COLORS = {
  'New': 'status-new',
  'Reviewing': 'status-reviewing',
  'Availability Confirmed': 'status-confirmed',
  'Awaiting Customer Response': 'status-waiting',
  'Converted to Order': 'status-converted',
  'Closed': 'status-closed',
  'Cancelled': 'status-cancelled',
};

export default function AccountEnquiries() {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    document.title = 'My Enquiries — FORME';
    if (!supabase || !user) return;

    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('product_inquiries')
        .select('id, reference_code, status, created_at, updated_at, size, color, quantity, products(name, image_url, brands(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (err) setError(err.message);
      else setEnquiries(data || []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = statusFilter === 'All'
    ? enquiries
    : enquiries.filter((e) => e.status === statusFilter);

  const statuses = ['All', ...Array.from(new Set(enquiries.map((e) => e.status)))];

  return (
    <div className="page account-page">
      <div className="container">
        <div className="page-header">
          <div>
            <p className="eyebrow">MY ACCOUNT</p>
            <h1>My Enquiries</h1>
            <p className="page-subtitle">Track all your product enquiries and their current status.</p>
          </div>
          <Link to="/shop" className="btn btn-outline">
            Browse Collection <ArrowUpRight size={14} />
          </Link>
        </div>

        {/* Status filter tabs */}
        {enquiries.length > 0 && (
          <div className="filter-tabs">
            {statuses.map((s) => (
              <button
                key={s}
                className={`filter-tab ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="page-loading"><span className="spinner" /></div>
        ) : error ? (
          <div className="error-state">
            <p>Could not load enquiries: {error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Package size={36} />
            <h3>{statusFilter === 'All' ? 'No enquiries yet' : `No ${statusFilter} enquiries`}</h3>
            <p>
              {statusFilter === 'All'
                ? 'Browse the collection and use the Enquire button on any product.'
                : 'Try a different status filter.'}
            </p>
            <Link to="/shop" className="btn btn-dark">Browse Collection</Link>
          </div>
        ) : (
          <div className="enquiry-full-list">
            {filtered.map((enq) => (
              <Link
                key={enq.id}
                to={`/account/enquiries/${enq.id}`}
                className="enquiry-full-item"
              >
                {enq.products?.image_url && (
                  <img
                    src={enq.products.image_url}
                    alt={enq.products.name}
                    className="enquiry-product-thumb"
                  />
                )}
                <div className="enquiry-full-info">
                  <span className="enquiry-brand">{enq.products?.brands?.name}</span>
                  <strong className="enquiry-product-name">{enq.products?.name || 'Product Enquiry'}</strong>
                  <div className="enquiry-meta-row">
                    {enq.size && <span>Size: {enq.size}</span>}
                    {enq.color && <span>Color: {enq.color}</span>}
                    {enq.quantity > 1 && <span>Qty: {enq.quantity}</span>}
                  </div>
                  <span className="enquiry-ref">
                    Ref: {enq.reference_code || shortRef(enq.id)}
                  </span>
                </div>
                <div className="enquiry-full-right">
                  <span className={`status-chip ${STATUS_COLORS[enq.status] || ''}`}>
                    {enq.status}
                  </span>
                  <span className="enquiry-date">
                    <Clock size={11} />
                    {new Date(enq.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                  <span className="enquiry-view-link">View details <ArrowUpRight size={12} /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
