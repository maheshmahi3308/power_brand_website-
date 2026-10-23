import React, { useEffect, useState } from 'react';
import { Users, Search, ShieldCheck, Mail, Phone, Calendar, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export default function AdminCustomers() {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Customer Directory — FORME Admin';
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // Supabase profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err) {
      toast(err.message || 'Error loading customer profiles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = customers.filter(c =>
    (c.full_name && c.full_name.toLowerCase().includes(search.toLowerCase())) ||
    (c.phone && c.phone.includes(search)) ||
    (c.id && c.id.includes(search))
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">USER DIRECTORY</p>
          <h1>Customer Accounts</h1>
          <p className="page-subtitle">
            Registered customer accounts. Privacy and access controls strictly enforced by database Row Level Security.
          </p>
        </div>
      </div>

      <div className="admin-filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, phone, or account ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="page-loading"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={32} />
            <h3>No registered accounts found</h3>
            <p>Customer accounts are created when visitors register on the website.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Contact Phone</th>
                  <th>Account Role</th>
                  <th>User ID</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="customer-cell">
                        <strong>{c.full_name || 'Unnamed Account'}</strong>
                      </div>
                    </td>
                    <td>
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="phone-link">
                          <Phone size={13} /> {c.phone}
                        </a>
                      ) : (
                        <span className="small-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${c.role === 'admin' ? 'pill-purple' : 'pill-green'}`}>
                        {c.role === 'admin' ? 'Administrator' : 'Customer'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono small-muted">{c.id.slice(0, 8)}...</span>
                    </td>
                    <td className="small-muted">
                      {new Date(c.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
