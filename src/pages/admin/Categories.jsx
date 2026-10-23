import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, FolderTree, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';

const INITIAL_FORM = {
  name: '',
  slug: '',
  description: '',
  is_published: true
};

export default function AdminCategories() {
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Category Management — FORME Admin';
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        // If categories table not yet created by user migration, fallback to mock/defaults
        console.warn('Categories query warning:', error);
      } else {
        setCategories(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditCategory(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditCategory(cat);
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      is_published: cat.is_published ?? true
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Category name is required.', 'error');
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
        is_published: form.is_published,
        updated_at: new Date().toISOString()
      };

      let result;
      if (editCategory) {
        result = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editCategory.id);
      } else {
        result = await supabase
          .from('categories')
          .insert(payload);
      }

      if (result.error) throw result.error;

      toast(`Category "${form.name}" saved successfully.`, 'success');
      setModalOpen(false);
      loadCategories();
    } catch (err) {
      toast(err.message || 'Error saving category.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">STORE TAXONOMY</p>
          <h1>Category Management</h1>
          <p className="page-subtitle">Configure department hierarchies for men, women, and small kids.</p>
        </div>
        <button className="btn btn-dark" onClick={openAdd}>
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="page-loading"><span className="spinner" /></div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <FolderTree size={32} />
            <h3>No custom categories registered</h3>
            <p>Categories can be managed via the database migration or added here.</p>
            <button className="btn btn-dark" onClick={openAdd}>Add First Category</button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="admin-brand-cell">
                        <FolderTree size={16} className="text-muted" />
                        <strong>{c.name}</strong>
                      </div>
                    </td>
                    <td className="font-mono small-muted">{c.slug}</td>
                    <td className="admin-desc-cell">{c.description || '—'}</td>
                    <td>
                      <span className={`status-pill ${c.is_published ? 'pill-green' : 'pill-amber'}`}>
                        {c.is_published ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-row">
                        <button className="icon-action-btn" onClick={() => openEdit(c)} title="Edit Category">
                          <Pencil size={15} />
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

      {/* Category Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCategory ? 'Edit Category' : 'Add Category'}
        size="md"
      >
        <p className="eyebrow">CATEGORY CONFIGURATION</p>
        <h2 className="modal-title">{editCategory ? 'Edit Category' : 'Add Category'}</h2>

        <form className="form" onSubmit={handleSave}>
          <label>
            Category Name *
            <input
              required
              placeholder="e.g. Footwear, Outerwear, Streetwear"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label>
            Slug Identifier <span className="optional">(auto-generated if blank)</span>
            <input
              placeholder="e.g. footwear"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </label>

          <label>
            Description <span className="optional">(optional)</span>
            <textarea
              rows="3"
              placeholder="Brief summary of pieces in this category..."
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
            Category active on public navigation
          </label>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark" disabled={busy}>
              {busy ? 'Saving...' : editCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
