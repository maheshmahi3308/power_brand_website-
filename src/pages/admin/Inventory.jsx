import React, { useEffect, useState } from 'react';
import { Search, Save, Boxes, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { money } from '../../lib/money';
import { useToast } from '../../context/ToastContext';

const AVAILABILITY_OPTIONS = ['Available', 'Check availability', 'Out of stock'];

export default function AdminInventory() {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    document.title = 'Inventory & Stock — FORME Admin';
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, category, price, sale_price, availability, stock_quantity, sizes, colors, brands(name)')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      toast(err.message || 'Error loading inventory', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, field, value) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const saveProductInventory = async (p) => {
    setSavingId(p.id);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          availability: p.availability,
          stock_quantity: p.stock_quantity !== '' && p.stock_quantity !== null ? parseInt(p.stock_quantity, 10) : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', p.id);

      if (error) throw error;
      toast(`Inventory for "${p.name}" updated.`, 'success');
    } catch (err) {
      toast(err.message || 'Error saving inventory.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.brands?.name && p.brands.name.toLowerCase().includes(search.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">STOCK &amp; AVAILABILITY</p>
          <h1>Inventory Management</h1>
          <p className="page-subtitle">Quickly adjust availability status and quantities to ensure accurate customer enquiries.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadInventory} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      <div className="admin-filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search piece, brand, or SKU..."
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
            <Boxes size={32} />
            <h3>No products found</h3>
            <p>Ensure products exist in the catalogue to manage their stock levels.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Configured Sizes</th>
                  <th>Availability Status</th>
                  <th>Stock Count</th>
                  <th>Save</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div>
                        <strong>{p.name}</strong>
                        {p.sku && <span className="small-muted font-mono block">SKU: {p.sku}</span>}
                      </div>
                    </td>
                    <td>{p.brands?.name || '—'}</td>
                    <td>
                      <div className="chips-compact">
                        {(p.sizes || []).map(s => <span key={s} className="chip-micro">{s}</span>)}
                      </div>
                    </td>
                    <td>
                      <select
                        className="admin-inline-select"
                        value={p.availability || 'Available'}
                        onChange={(e) => handleUpdate(p.id, 'availability', e.target.value)}
                      >
                        {AVAILABILITY_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="admin-inline-input"
                        placeholder="Count"
                        value={p.stock_quantity ?? ''}
                        onChange={(e) => handleUpdate(p.id, 'stock_quantity', e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-dark btn-sm"
                        disabled={savingId === p.id}
                        onClick={() => saveProductInventory(p)}
                      >
                        {savingId === p.id ? 'Saving...' : <><Save size={13} /> Save</>}
                      </button>
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
