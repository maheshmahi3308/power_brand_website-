import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, Tag, Image } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';

const INITIAL_FORM = {
  name: '',
  slug: '',
  description: '',
  logo_url: '',
  is_published: true
};

export default function AdminBrands() {
  const toast = useToast();

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Brand Management — FORME Admin';
    loadBrands();
  }, []);

  const loadBrands = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      toast(err.message || 'Error loading brands', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditBrand(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEdit = (b) => {
    setEditBrand(b);
    setForm({
      name: b.name || '',
      slug: b.slug || '',
      description: b.description || '',
      logo_url: b.logo_url || '',
      is_published: b.is_published ?? true
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Brand name is required.', 'error');
      return;
    }

    setBusy(true);
    try {
      const slugVal = form.slug.trim() ||
        form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const payload = {
        name: form.name.trim(),
        slug: slugVal,
        description: form.description.trim() || null,
        logo_url: form.logo_url.trim() || null,
        is_published: form.is_published,
        updated_at: new Date().toISOString()
      };

      let result;
      if (editBrand) {
        result = await supabase
          .from('brands')
          .update(payload)
          .eq('id', editBrand.id);
      } else {
        result = await supabase
          .from('brands')
          .insert(payload);
      }

      if (result.error) throw result.error;

      toast(`Brand "${form.name}" saved.`, 'success');
      setModalOpen(false);
      loadBrands();
    } catch (err) {
      toast(err.message || 'Error saving brand.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (b) => {
    const nextStatus = !b.is_published;
    try {
      const { error } = await supabase
        .from('brands')
        .update({ is_published: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', b.id);

      if (error) throw error;
      setBrands(brands.map(x => x.id === b.id ? { ...x, is_published: nextStatus } : x));
      toast(`Brand "${b.name}" ${nextStatus ? 'published' : 'hidden'}.`, 'success');
    } catch (err) {
      toast(err.message || 'Error updating brand state.', 'error');
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete brand "${b.name}"? This will fail if products are linked to this brand.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', b.id);

      if (error) throw error;
      setBrands(brands.filter(x => x.id !== b.id));
      toast(`Brand "${b.name}" deleted.`, 'success');
    } catch (err) {
      toast(err.message || 'Cannot delete brand with associated products.', 'error');
    }
  };

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">LABELS &amp; DESIGNERS</p>
          <h1>Brand Management</h1>
          <p className="page-subtitle">Configure recognized fashion brands, descriptions, and storefront visibility.</p>
        </div>
        <button className="btn btn-dark" onClick={openAdd}>
          <Plus size={16} /> Add Brand
        </button>
      </div>

      <div className="admin-filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search brands..."
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
            <Tag size={32} />
            <h3>No brands configured</h3>
            <p>Add popular fashion brands to begin categorizing pieces.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Brand Name</th>
                  <th>Slug Identifier</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="admin-brand-cell">
                        {b.logo_url ? (
                          <img src={b.logo_url} alt="" className="admin-brand-thumb" />
                        ) : (
                          <div className="admin-brand-thumb placeholder"><Tag size={14} /></div>
                        )}
                        <strong>{b.name}</strong>
                      </div>
                    </td>
                    <td className="font-mono small-muted">{b.slug}</td>
                    <td className="admin-desc-cell">{b.description || '—'}</td>
                    <td>
                      <button
                        className={`btn-status-toggle ${b.is_published ? 'is-pub' : 'is-draft'}`}
                        onClick={() => togglePublish(b)}
                      >
                        {b.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                        <span>{b.is_published ? 'Published' : 'Hidden'}</span>
                      </button>
                    </td>
                    <td>
                      <div className="admin-action-row">
                        <button className="icon-action-btn" onClick={() => openEdit(b)} title="Edit Brand">
                          <Pencil size={15} />
                        </button>
                        <button className="icon-action-btn delete" onClick={() => handleDelete(b)} title="Delete Brand">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Brand Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editBrand ? 'Edit Brand' : 'Add New Brand'}
        size="md"
      >
        <p className="eyebrow">BRAND CONFIGURATION</p>
        <h2 className="modal-title">{editBrand ? 'Edit Brand' : 'Add New Brand'}</h2>

        <form className="form" onSubmit={handleSave}>
          <label>
            Brand Name *
            <input
              required
              placeholder="e.g. Brand Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label>
            Slug Identifier <span className="optional">(auto-generated if blank)</span>
            <input
              placeholder="e.g. nike"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </label>

          <label>
            Brand Logo URL <span className="optional">(optional)</span>
            <input
              type="url"
              placeholder="https://..."
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            />
          </label>

          <label>
            Description <span className="optional">(optional)</span>
            <textarea
              rows="3"
              placeholder="Brief summary of brand aesthetics and product types..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <label className="check-label">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            Display brand on public storefront and navigation
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark" disabled={busy}>
              {busy ? 'Saving...' : editBrand ? 'Update Brand' : 'Create Brand'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
