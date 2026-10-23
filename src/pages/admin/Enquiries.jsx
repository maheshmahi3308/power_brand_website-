import React, { useEffect, useState } from 'react';
import {
  Inbox, Search, Phone, MessageCircle, Clock,
  ArrowUpRight, AlertCircle, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { shortRef } from '../../lib/money';
import { CONTACT } from '../../lib/contact';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';

const STATUS_OPTIONS = [
  'New',
  'Reviewing',
  'Availability Confirmed',
  'Awaiting Customer Response',
  'Converted to Order',
  'Closed',
  'Cancelled'
];

export default function AdminEnquiries() {
  const toast = useToast();

  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected enquiry for detail view
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    document.title = 'Enquiry Management — FORME Admin';
    loadEnquiries();
  }, []);

  const loadEnquiries = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('product_inquiries')
        .select(`
          id, reference_code, user_id, customer_name, email, phone,
          guest_name, guest_email, guest_phone,
          size, color, quantity, message, consent, status,
          admin_notes, created_at, updated_at,
          products(id, name, image_url, price, sale_price, brands(name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEnquiries(data || []);
    } catch (err) {
      toast(err.message || 'Error fetching enquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (enq) => {
    setSelectedEnquiry(enq);
    setNewStatus(enq.status);
    setAdminNotes(enq.admin_notes || '');
  };

  const handleUpdateStatus = async (enquiryId, status) => {
    try {
      const { error } = await supabase
        .from('product_inquiries')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', enquiryId);

      if (error) throw error;

      setEnquiries(enquiries.map(e => e.id === enquiryId ? { ...e, status } : e));
      if (selectedEnquiry && selectedEnquiry.id === enquiryId) {
        setSelectedEnquiry({ ...selectedEnquiry, status });
      }
      toast(`Enquiry status updated to "${status}".`, 'success');
    } catch (err) {
      toast(err.message || 'Could not update status.', 'error');
    }
  };

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;

    setSavingNote(true);
    try {
      const { error } = await supabase
        .from('product_inquiries')
        .update({
          admin_notes: adminNotes.trim() || null,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEnquiry.id);

      if (error) throw error;

      setEnquiries(enquiries.map(e =>
        e.id === selectedEnquiry.id
          ? { ...e, admin_notes: adminNotes.trim(), status: newStatus }
          : e
      ));
      setSelectedEnquiry({
        ...selectedEnquiry,
        admin_notes: adminNotes.trim(),
        status: newStatus
      });
      toast('Admin notes and status saved.', 'success');
    } catch (err) {
      toast(err.message || 'Error saving internal notes.', 'error');
    } finally {
      setSavingNote(false);
    }
  };

  // Helper to format WhatsApp message to customer
  const customerWhatsAppLink = (enq) => {
    const rawPhone = enq.phone || enq.guest_phone || '';
    if (!rawPhone) return '#';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const name = enq.customer_name || enq.guest_name || 'Customer';
    const prod = enq.products?.name || 'your fashion piece';
    const ref = enq.reference_code || shortRef(enq.id);
    const msg = `Hello ${name}, this is ${CONTACT.name} from FORME regarding your enquiry (Ref: ${ref}) for "${prod}".`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
  };

  const filtered = enquiries.filter(enq => {
    const ref = (enq.reference_code || shortRef(enq.id)).toLowerCase();
    const name = (enq.customer_name || enq.guest_name || '').toLowerCase();
    const email = (enq.email || enq.guest_email || '').toLowerCase();
    const phone = (enq.phone || enq.guest_phone || '');
    const prod = (enq.products?.name || '').toLowerCase();
    const q = search.toLowerCase();

    const matchesSearch = ref.includes(q) || name.includes(q) || email.includes(q) || phone.includes(q) || prod.includes(q);
    const matchesStatus = statusFilter === 'All' || enq.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">PRIMARY ORDER WORKFLOW</p>
          <h1>Product Enquiries</h1>
          <p className="page-subtitle">Manage customer and guest purchase enquiries, update availability status, and add internal notes.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by ref, customer name, email, phone, or piece..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="select-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter status"
            >
              <option value="All">All Statuses ({enquiries.length})</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>
                  {opt} ({enquiries.filter(e => e.status === opt).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="admin-card">
        {loading ? (
          <div className="page-loading"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Inbox size={32} />
            <h3>No enquiries match the filter</h3>
            <p>Try searching for a different name, ref code, or change the status filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Customer Info</th>
                  <th>Requested Piece</th>
                  <th>Variants</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((enq) => {
                  const ref = enq.reference_code || shortRef(enq.id);
                  const custName = enq.customer_name || enq.guest_name || 'Guest';
                  const custPhone = enq.phone || enq.guest_phone || '';
                  const custEmail = enq.email || enq.guest_email || '';

                  return (
                    <tr key={enq.id}>
                      <td>
                        <strong className="font-mono">{ref}</strong>
                        {!enq.user_id && <span className="badge-guest-pill">Guest</span>}
                      </td>
                      <td>
                        <div className="customer-cell">
                          <strong>{custName}</strong>
                          <span className="small-muted">{custEmail}</span>
                          {custPhone && <span className="small-muted font-mono">{custPhone}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="product-cell-mini">
                          <span>{enq.products?.brands?.name}</span>
                          <strong>{enq.products?.name || 'Product'}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="variants-mini">
                          {enq.size && <span>Size: {enq.size}</span>}
                          {enq.color && <span>Color: {enq.color}</span>}
                          <span>Qty: {enq.quantity}</span>
                        </div>
                      </td>
                      <td>
                        <select
                          className={`status-select status-${enq.status.toLowerCase().replace(/\s+/g, '-')}`}
                          value={enq.status}
                          onChange={(e) => handleUpdateStatus(enq.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="small-muted">
                        {new Date(enq.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td>
                        <div className="admin-action-row">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => openDetail(enq)}
                          >
                            Details
                          </button>

                          {custPhone && (
                            <>
                              <a
                                href={`tel:${custPhone}`}
                                className="icon-action-btn"
                                title="Call Customer"
                              >
                                <Phone size={14} />
                              </a>
                              <a
                                href={customerWhatsAppLink(enq)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="icon-action-btn whatsapp-action"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle size={14} />
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Enquiry Modal */}
      <Modal
        open={Boolean(selectedEnquiry)}
        onClose={() => setSelectedEnquiry(null)}
        title="Enquiry Details"
        size="lg"
      >
        {selectedEnquiry && (
          <div>
            <div className="modal-header-row">
              <div>
                <p className="eyebrow">ENQUIRY RECORD</p>
                <h2 className="modal-title">
                  Ref: {selectedEnquiry.reference_code || shortRef(selectedEnquiry.id)}
                </h2>
              </div>
              <span className={`status-chip status-${selectedEnquiry.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {selectedEnquiry.status}
              </span>
            </div>

            <div className="enquiry-modal-grid">
              {/* Product Info */}
              <div className="modal-section-card">
                <h3>Product Requested</h3>
                <div className="enquiry-product-preview">
                  {selectedEnquiry.products?.image_url && (
                    <img src={selectedEnquiry.products.image_url} alt="" />
                  )}
                  <div>
                    <span className="product-brand">{selectedEnquiry.products?.brands?.name}</span>
                    <strong>{selectedEnquiry.products?.name}</strong>
                    <div className="small-muted">
                      Size: <strong>{selectedEnquiry.size || 'Unspecified'}</strong> &nbsp;·&nbsp;
                      Color: <strong>{selectedEnquiry.color || 'Unspecified'}</strong> &nbsp;·&nbsp;
                      Qty: <strong>{selectedEnquiry.quantity}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="modal-section-card">
                <h3>Customer Information</h3>
                <div className="customer-info-grid">
                  <div>
                    <span className="small-muted">Name</span>
                    <strong>{selectedEnquiry.customer_name || selectedEnquiry.guest_name || 'Guest'}</strong>
                  </div>
                  <div>
                    <span className="small-muted">Account Type</span>
                    <strong>{selectedEnquiry.user_id ? 'Registered Customer' : 'Guest Visitor'}</strong>
                  </div>
                  <div>
                    <span className="small-muted">Email</span>
                    <strong>{selectedEnquiry.email || selectedEnquiry.guest_email || '—'}</strong>
                  </div>
                  <div>
                    <span className="small-muted">Phone Number</span>
                    <strong>{selectedEnquiry.phone || selectedEnquiry.guest_phone || '—'}</strong>
                  </div>
                </div>

                <div className="customer-direct-connect">
                  {(selectedEnquiry.phone || selectedEnquiry.guest_phone) && (
                    <>
                      <a
                        href={`tel:${selectedEnquiry.phone || selectedEnquiry.guest_phone}`}
                        className="btn btn-outline btn-sm"
                      >
                        <Phone size={13} /> Call Customer
                      </a>
                      <a
                        href={customerWhatsAppLink(selectedEnquiry)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-whatsapp btn-sm"
                      >
                        <MessageCircle size={13} /> WhatsApp Message
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Message */}
            {selectedEnquiry.message && (
              <div className="modal-section-card">
                <h3>Customer Note / Additional Requirements</h3>
                <p className="enquiry-customer-msg">{selectedEnquiry.message}</p>
              </div>
            )}

            {/* Internal Admin Notes Form */}
            <form className="form modal-section-card" onSubmit={handleSaveNotes}>
              <h3>Internal Admin Notes (Private)</h3>
              <p className="small-muted">
                Document inventory checks, customer conversations, pricing quotes, or shipping tracking numbers here. This is never shown to customers.
              </p>

              <div className="form-two">
                <label>
                  Update Status
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>

              <label>
                Private Admin Notes
                <textarea
                  rows="3"
                  placeholder="e.g. Size M checked in stock. Quoted ₹1899 including pan-India delivery. Customer confirmed via WhatsApp."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setSelectedEnquiry(null)}>
                  Close
                </button>
                <button type="submit" className="btn btn-dark" disabled={savingNote}>
                  {savingNote ? 'Saving Notes...' : 'Save Notes & Status'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
