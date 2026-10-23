import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Boxes, Tag, Inbox, CheckCircle2, Clock,
  ArrowUpRight, AlertCircle, TrendingUp, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { money, shortRef } from '../../lib/money';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    publishedProducts: 0,
    draftProducts: 0,
    totalBrands: 0,
    newEnquiries: 0,
    reviewingEnquiries: 0,
    convertedEnquiries: 0
  });
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Dashboard Overview — FORME Admin';
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // Run queries concurrently
      const [
        pubRes,
        draftRes,
        brandsRes,
        newEnqRes,
        reviewEnqRes,
        convertedEnqRes,
        recentEnqRes
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_published', false),
        supabase.from('brands').select('*', { count: 'exact', head: true }),
        supabase.from('product_inquiries').select('*', { count: 'exact', head: true }).eq('status', 'New'),
        supabase.from('product_inquiries').select('*', { count: 'exact', head: true }).eq('status', 'Reviewing'),
        supabase.from('product_inquiries').select('*', { count: 'exact', head: true }).eq('status', 'Converted to Order'),
        supabase
          .from('product_inquiries')
          .select('id, reference_code, customer_name, email, phone, status, created_at, products(name, brand_id, brands(name))')
          .order('created_at', { ascending: false })
          .limit(6)
      ]);

      setStats({
        publishedProducts: pubRes.count || 0,
        draftProducts: draftRes.count || 0,
        totalBrands: brandsRes.count || 0,
        newEnquiries: newEnqRes.count || 0,
        reviewingEnquiries: reviewEnqRes.count || 0,
        convertedEnquiries: convertedEnqRes.count || 0
      });

      setRecentEnquiries(recentEnqRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError(err.message || 'Error fetching statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">STORE HEALTH &amp; METRICS</p>
          <h1>Overview Dashboard</h1>
          <p className="page-subtitle">Real-time counts backed directly by the PostgreSQL database.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadDashboardData} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh Data
        </button>
      </div>

      {error && (
        <div className="auth-error-alert" role="alert">
          <AlertCircle size={16} />
          <span>Database connection error: {error}</span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="admin-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon bg-green-subtle">
            <Package size={20} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Published Products</span>
            <strong className="metric-value">{loading ? '—' : stats.publishedProducts}</strong>
            <span className="metric-foot">Active on public store</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-amber-subtle">
            <Boxes size={20} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Draft / Archived</span>
            <strong className="metric-value">{loading ? '—' : stats.draftProducts}</strong>
            <span className="metric-foot">Hidden from public</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-blue-subtle">
            <Tag size={20} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Total Brands</span>
            <strong className="metric-value">{loading ? '—' : stats.totalBrands}</strong>
            <span className="metric-foot">Configured labels</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-red-subtle">
            <Inbox size={20} />
          </div>
          <div className="metric-data">
            <span className="metric-label">New Enquiries</span>
            <strong className="metric-value">{loading ? '—' : stats.newEnquiries}</strong>
            <span className="metric-foot highlight-alert">Awaiting initial review</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-purple-subtle">
            <Clock size={20} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Under Review</span>
            <strong className="metric-value">{loading ? '—' : stats.reviewingEnquiries}</strong>
            <span className="metric-foot">Checking availability</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon bg-emerald-subtle">
            <CheckCircle2 size={20} />
          </div>
          <div className="metric-data">
            <span className="metric-label">Converted to Order</span>
            <strong className="metric-value">{loading ? '—' : stats.convertedEnquiries}</strong>
            <span className="metric-foot">Successfully confirmed</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Enquiries */}
      <div className="admin-section-grid">
        {/* Recent Enquiries Table */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h2>Latest Incoming Enquiries</h2>
              <p>Most recent enquiries submitted by visitors and customers.</p>
            </div>
            <Link to="/admin/enquiries" className="text-link-sm">
              View All Enquiries <ArrowUpRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="page-loading"><span className="spinner" /></div>
          ) : recentEnquiries.length === 0 ? (
            <div className="empty-state">
              <Inbox size={32} />
              <h3>No enquiries recorded yet</h3>
              <p>When customers or guests submit an enquiry, it will populate here automatically.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ref</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEnquiries.map((enq) => (
                    <tr key={enq.id}>
                      <td>
                        <strong className="font-mono">
                          {enq.reference_code || shortRef(enq.id)}
                        </strong>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <strong>{enq.customer_name || 'Guest'}</strong>
                          <span>{enq.phone || enq.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="product-cell-mini">
                          <span>{enq.products?.brands?.name}</span>
                          <strong>{enq.products?.name || 'Product'}</strong>
                        </div>
                      </td>
                      <td>
                        <span className={`status-chip status-${enq.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {enq.status}
                        </span>
                      </td>
                      <td className="small-muted">
                        {new Date(enq.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Management Shortcuts */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Management Shortcuts</h2>
          </div>
          <div className="admin-quick-actions">
            <Link to="/admin/products" className="admin-quick-link">
              <Package size={18} />
              <div>
                <strong>Manage Products</strong>
                <span>Add, update pricing, or edit catalogues</span>
              </div>
              <ArrowUpRight size={14} />
            </Link>

            <Link to="/admin/enquiries" className="admin-quick-link">
              <Inbox size={18} />
              <div>
                <strong>Process Enquiries</strong>
                <span>Update status, internal notes, WhatsApp client</span>
              </div>
              <ArrowUpRight size={14} />
            </Link>

            <Link to="/admin/brands" className="admin-quick-link">
              <Tag size={18} />
              <div>
                <strong>Brands &amp; Labels</strong>
                <span>Add new brands, update logos &amp; descriptions</span>
              </div>
              <ArrowUpRight size={14} />
            </Link>

            <Link to="/admin/inventory" className="admin-quick-link">
              <Boxes size={18} />
              <div>
                <strong>Inventory Status</strong>
                <span>Update sizes, colors, and availability flags</span>
              </div>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
