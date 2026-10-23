import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Heart, User, Clock, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { money, shortRef } from '../../lib/money';

const STATUS_COLORS = {
  'New': 'status-new',
  'Reviewing': 'status-reviewing',
  'Availability Confirmed': 'status-confirmed',
  'Awaiting Customer Response': 'status-waiting',
  'Converted to Order': 'status-converted',
  'Closed': 'status-closed',
  'Cancelled': 'status-cancelled',
};

export default function AccountDashboard() {
  const { profile, user, session } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'My Account — FORME';
    if (!supabase || !user) return;

    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('product_inquiries')
        .select('id, reference_code, status, created_at, products(name, image_url, brands(name))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (err) setError(err.message);
      else setEnquiries(data || []);
      setLoading(false);
    })();
  }, [user]);

  const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'there';

  return (
    <div className="page account-page">
      <div className="container">
        {/* Welcome */}
        <div className="account-header">
          <div className="account-avatar">
            <User size={28} />
          </div>
          <div>
            <p className="eyebrow">YOUR FORME ACCOUNT</p>
            <h1 className="account-greeting">Hello, {displayName}.</h1>
            <p className="account-email">{session?.user?.email}</p>
          </div>
        </div>

        {/* Quick links */}
        <div className="account-quick-links">
          <Link to="/account/enquiries" className="account-quick-card">
            <Package size={22} />
            <span>My Enquiries</span>
            <ArrowUpRight size={15} />
          </Link>
          <Link to="/account/wishlist" className="account-quick-card">
            <Heart size={22} />
            <span>Wishlist</span>
            <ArrowUpRight size={15} />
          </Link>
          <Link to="/account/profile" className="account-quick-card">
            <User size={22} />
            <span>My Profile</span>
            <ArrowUpRight size={15} />
          </Link>
        </div>

        {/* Recent enquiries */}
        <div className="account-section">
          <div className="account-section-header">
            <h2>Recent Enquiries</h2>
            <Link to="/account/enquiries" className="text-link-sm">View all</Link>
          </div>

          {loading ? (
            <div className="page-loading"><span className="spinner" /></div>
          ) : error ? (
            <p className="error-text">Could not load enquiries: {error}</p>
          ) : enquiries.length === 0 ? (
            <div className="empty-state">
              <Package size={36} />
              <h3>No enquiries yet</h3>
              <p>Browse the collection and enquire about products you love.</p>
              <Link to="/shop" className="btn btn-dark">Browse Collection <ArrowUpRight size={14} /></Link>
            </div>
          ) : (
            <div className="enquiry-list">
              {enquiries.map((enq) => (
                <Link
                  key={enq.id}
                  to={`/account/enquiries/${enq.id}`}
                  className="enquiry-list-item"
                >
                  <div className="enquiry-item-info">
                    <strong>{enq.products?.name || 'Product Enquiry'}</strong>
                    <span className="enquiry-ref">
                      Ref: {enq.reference_code || shortRef(enq.id)}
                    </span>
                    <span className="enquiry-date">
                      <Clock size={11} /> {new Date(enq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <span className={`status-chip ${STATUS_COLORS[enq.status] || ''}`}>
                    {enq.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Browse CTA */}
        <div className="account-cta-band">
          <div>
            <h3>Discover something new</h3>
            <p>Explore our latest arrivals and featured brands.</p>
          </div>
          <Link to="/shop" className="btn btn-dark">
            Browse Collection <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
