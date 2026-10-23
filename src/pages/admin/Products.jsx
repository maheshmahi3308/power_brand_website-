import React, { useEffect, useState } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Search,
  ArrowUpRight, CheckCircle2, AlertCircle, X, Image
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { money, discountPct } from '../../lib/money';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';

const CATEGORIES = ['Men', 'Women', 'Kids'];
const AVAILABILITIES = ['Available', 'Check availability', 'Out of stock'];

const INITIAL_FORM = {
  name: '',
  slug: '',
  brand_id: '',
  category: 'Men',
  short_description: '',
  description: '',
  price: '',
  sale_price: '',
  sizes: 'S, M, L, XL',
  colors: 'Black, White',
  sku: '',
  stock_quantity: '',
  availability: 'Available',
  image_url: '',
  is_published: true,
  is_featured: false,
  is_new_arrival: false,
  is_on_offer: false
};

export default function AdminProducts() {
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal & form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Product Management — FORME Admin';
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const [prodRes, brandRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, brands(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('brands')
          .select('id, name')
          .order('name')
      ]);

      if (prodRes.error) throw prodRes.error;
      if (brandRes.error) throw brandRes.error;

      setProducts(prodRes.data || []);
      setBrands(brandRes.data || []);
    } catch (err) {
      toast(err.message || 'Error loading product catalogue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditProduct(null);
    setForm({
      ...INITIAL_FORM,
      brand_id: brands[0]?.id || ''
    });
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditProduct(p);
    setForm({
      name: p.name || '',
      slug: p.slug || '',
      brand_id: p.brand_id || '',
      category: p.category || 'Men',
      short_description: p.short_description || '',
      description: p.description || '',
      price: p.price ?? '',
      sale_price: p.sale_price ?? '',
      sizes: (p.sizes || []).join(', '),
      colors: (p.colors || []).join(', '),
      sku: p.sku || '',
      stock_quantity: p.stock_quantity ?? '',
      availability: p.availability || 'Available',
      image_url: p.image_url || '',
      is_published: p.is_published ?? true,
      is_featured: p.is_featured ?? false,
      is_new_arrival: p.is_new_arrival ?? false,
      is_on_offer: p.is_on_offer ?? false
    });
    setModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.brand_id || !form.price) {
      toast('Please enter the product name, brand, and regular price.', 'error');
      return;
    }

    setBusy(true);
    try {
      const slugVal = form.slug.trim() ||
        form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const payload = {
        name: form.name.trim(),
        slug: slugVal,
        brand_id: form.brand_id,
        category: form.category,
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        price: Number(form.price),
        sale_price: form.sale_price !== '' ? Number(form.sale_price) : null,
        sizes: form.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: form.colors.split(',').map(c => c.trim()).filter(Boolean),
        sku: form.sku.trim() || null,
        stock_quantity: form.stock_quantity !== '' ? parseInt(form.stock_quantity, 10) : null,
        availability: form.availability,
        image_url: form.image_url.trim() || null,
        is_published: form.is_published,
        publication_status: form.is_published ? 'published' : 'draft',
        is_featured: form.is_featured,
        is_new_arrival: form.is_new_arrival,
        is_on_offer: form.is_on_offer || Boolean(form.sale_price && Number(form.sale_price) < Number(form.price)),
        updated_at: new Date().toISOString()
      };

      let result;
      if (editProduct) {
        result = await supabase
          .from('products')
          .update(payload)
          .eq('id', editProduct.id);
      } else {
        result = await supabase
          .from('products')
          .insert(payload);
      }

      if (result.error) throw result.error;

      toast(`Product ${editProduct ? 'updated' : 'created'} successfully.`, 'success');
      setModalOpen(false);
      loadData();
    } catch (err) {
      toast(err.message || 'Failed to save product.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (p) => {
    const nextStatus = !p.is_published;
    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_published: nextStatus,
          publication_status: nextStatus ? 'published' : 'draft',
          updated_at: new Date().toISOString()
        })
        .eq('id', p.id);

      if (error) throw error;
      setProducts(products.map(x => x.id === p.id ? { ...x, is_published: nextStatus } : x));
      toast(`Product marked as ${nextStatus ? 'Published' : 'Draft'}.`, 'success');
    } catch (err) {
      toast(err.message || 'Could not update publication state.', 'error');
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${p.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', p.id);

      if (error) throw error;
      setProducts(products.filter(x => x.id !== p.id));
      toast(`Product "${p.name}" removed from catalogue.`, 'success');
    } catch (err) {
      toast(err.message || 'Cannot delete product with existing enquiries.', 'error');
    }
  };

  // Filtered list
  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brands?.name && p.brands.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
    const matchesStatus =
      filterStatus === 'All' ||
      (filterStatus === 'Published' && p.is_published) ||
      (filterStatus === 'Draft' && !p.is_published);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="eyebrow">CATALOGUE MANAGEMENT</p>
          <h1>Products &amp; Pieces</h1>
          <p className="page-subtitle">Add, edit, publish, set discounts, and control piece visibility.</p>
        </div>
        <button className="btn btn-dark" onClick={openAddModal}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by product name, brand or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="select-wrap">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filter category"
            >
              <option value="All">All Categories</option>
              <option value="Men">Men's Fashion</option>
              <option value="Women">Women's Fashion</option>
              <option value="Kids">Small Kids</option>
            </select>
          </div>

          <div className="select-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter status"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published Only</option>
              <option value="Draft">Drafts Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="admin-card">
        {loading ? (
          <div className="page-loading"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>Try modifying your search or click "Add Product" to create your first listing.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Piece</th>
                  <th>Brand &amp; Category</th>
                  <th>Price &amp; Sale</th>
                  <th>Inventory</th>
                  <th>Flags</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const pct = discountPct(p.price, p.sale_price);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="admin-product-cell">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="admin-product-thumb" />
                          ) : (
                            <div className="admin-product-thumb placeholder"><Image size={16} /></div>
                          )}
                          <div>
                            <strong>{p.name}</strong>
                            {p.sku && <span className="small-muted font-mono">SKU: {p.sku}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="cell-stacked">
                          <strong>{p.brands?.name || 'Unassigned'}</strong>
                          <span className="small-muted">{p.category}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-stacked">
                          <strong>{money(p.sale_price || p.price)}</strong>
                          {p.sale_price && p.sale_price < p.price && (
                            <span className="discount-tag-sm">Save {pct}% (Was {money(p.price)})</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="cell-stacked">
                          <span className={`status-pill ${p.availability === 'Available' ? 'pill-green' : 'pill-amber'}`}>
                            {p.availability}
                          </span>
                          {p.stock_quantity !== null && (
                            <span className="small-muted">Stock: {p.stock_quantity}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="tags-stack">
                          {p.is_featured && <span className="admin-tag tag-featured">Featured</span>}
                          {p.is_new_arrival && <span className="admin-tag tag-new">New</span>}
                          {p.is_on_offer && <span className="admin-tag tag-offer">Offer</span>}
                        </div>
                      </td>
                      <td>
                        <button
                          className={`btn-status-toggle ${p.is_published ? 'is-pub' : 'is-draft'}`}
                          onClick={() => togglePublish(p)}
                          title="Click to toggle publish status"
                        >
                          {p.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
                          <span>{p.is_published ? 'Published' : 'Draft'}</span>
                        </button>
                      </td>
                      <td>
                        <div className="admin-action-row">
                          <button
                            className="icon-action-btn"
                            onClick={() => openEditModal(p)}
                            title="Edit Product"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="icon-action-btn delete"
                            onClick={() => handleDelete(p)}
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
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

      {/* Add / Edit Product Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <p className="eyebrow">CATALOGUE CONTROL</p>
        <h2 className="modal-title">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>

        <form className="form" onSubmit={handleSaveProduct}>
          <div className="form-two">
            <label>
              Product Name *
              <input
                required
                placeholder="e.g. Vintage Denim Jacket"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Brand *
              <select
                required
                value={form.brand_id}
                onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
              >
                <option value="">Select Brand</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-two">
            <label>
              Category *
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Men">Men's Fashion</option>
                <option value="Women">Women's Fashion</option>
                <option value="Kids">Small Kids</option>
              </select>
            </label>
            <label>
              URL Slug <span className="optional">(auto-generated if blank)</span>
              <input
                placeholder="e.g. vintage-denim-jacket"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </label>
          </div>

          <div className="form-two">
            <label>
              Original Regular Price (₹) *
              <input
                type="number"
                min="0"
                required
                placeholder="e.g. 2999"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
            <label>
              Sale / Discounted Price (₹) <span className="optional">(optional)</span>
              <input
                type="number"
                min="0"
                placeholder="e.g. 2199"
                value={form.sale_price}
                onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
              />
            </label>
          </div>

          <label>
            Image URL
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
          </label>

          <div className="form-two">
            <label>
              Available Sizes (comma separated)
              <input
                placeholder="S, M, L, XL"
                value={form.sizes}
                onChange={(e) => setForm({ ...form, sizes: e.target.value })}
              />
            </label>
            <label>
              Available Colors (comma separated)
              <input
                placeholder="Black, Navy Blue, White"
                value={form.colors}
                onChange={(e) => setForm({ ...form, colors: e.target.value })}
              />
            </label>
          </div>

          <div className="form-two">
            <label>
              Availability Status
              <select
                value={form.availability}
                onChange={(e) => setForm({ ...form, availability: e.target.value })}
              >
                {AVAILABILITIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
            <label>
              SKU / Product Code <span className="optional">(optional)</span>
              <input
                placeholder="e.g. FRM-JKT-042"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </label>
          </div>

          <label>
            Short Description <span className="optional">(brief teaser)</span>
            <input
              placeholder="Comfortable relaxed fit outerwear designed for everyday styling."
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
            />
          </label>

          <label>
            Full Product Description
            <textarea
              rows="3"
              placeholder="Detailed fabrication, care instructions, and brand background..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          {/* Flags checkboxes */}
          <div className="checkbox-grid">
            <label className="check-label">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              Publish immediately on storefront
            </label>

            <label className="check-label">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              Mark as Featured Piece
            </label>

            <label className="check-label">
              <input
                type="checkbox"
                checked={form.is_new_arrival}
                onChange={(e) => setForm({ ...form, is_new_arrival: e.target.checked })}
              />
              Mark as New Arrival
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark" disabled={busy}>
              {busy ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
