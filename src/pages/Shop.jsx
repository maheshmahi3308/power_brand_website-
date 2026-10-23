import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, X, Package, ChevronDown,
  RotateCcw, ArrowUpDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ui/ProductCard';
import EnquiryModal from '../components/ui/EnquiryModal';

const CATEGORIES = [
  { id: 'All', label: 'All Departments' },
  { id: 'Men', label: "Men's Fashion" },
  { id: 'Women', label: "Women's Fashion" },
  { id: 'Kids', label: 'Small Kids' }
];

export default function Shop({ defaultCategory = null, pageTitle = null }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters from query params
  const queryParam = searchParams.get('q') || '';
  const brandParam = searchParams.get('brand') || 'All';
  const categoryParam = defaultCategory || searchParams.get('category') || 'All';
  const sortParam = searchParams.get('sort') || 'featured';

  // Local filter states
  const [search, setSearch] = useState(queryParam);
  const [selectedBrand, setSelectedBrand] = useState(brandParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedSort, setSelectedSort] = useState(sortParam);
  const [visibleCount, setVisibleCount] = useState(12);

  // Modals & Wishlist
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  // Sync state with URL params
  useEffect(() => {
    setSearch(searchParams.get('q') || '');
    setSelectedBrand(searchParams.get('brand') || 'All');
    setSelectedCategory(defaultCategory || searchParams.get('category') || 'All');
    setSelectedSort(searchParams.get('sort') || 'featured');
  }, [searchParams, defaultCategory]);

  useEffect(() => {
    document.title = `${pageTitle || 'Shop All'} — FORME`;
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const [prodRes, brandRes] = await Promise.all([
        supabase
          .from('products')
          .select('*, brands(name)')
          .eq('is_published', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('brands')
          .select('id, name')
          .eq('is_published', true)
          .order('name')
      ]);

      if (prodRes.error) throw prodRes.error;
      if (brandRes.error) throw brandRes.error;

      setProducts((prodRes.data || []).map(p => ({
        ...p,
        brand_name: p.brands?.name || 'Brand',
        display_image: p.image_url || p.images?.[0] || ''
      })));

      setBrands(brandRes.data || []);
    } catch (err) {
      console.error('Shop load error:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'All' || (key === 'sort' && value === 'featured')) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setSearch('');
    setSelectedBrand('All');
    setSelectedCategory('All');
    setSelectedSort('featured');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
    selectedBrand !== 'All' ||
    (selectedCategory !== 'All' && !defaultCategory) ||
    selectedSort !== 'featured'
  );

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand_name && p.brand_name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Category
    if (selectedCategory && selectedCategory !== 'All') {
      list = list.filter(p =>
        p.category && p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Brand
    if (selectedBrand && selectedBrand !== 'All') {
      list = list.filter(p =>
        p.brand_name && p.brand_name.toLowerCase() === selectedBrand.toLowerCase()
      );
    }

    // Sort
    if (selectedSort === 'price-low') {
      list.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    } else if (selectedSort === 'price-high') {
      list.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    } else if (selectedSort === 'name-az') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedSort === 'newest') {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else {
      // 'featured'
      list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    return list;
  }, [products, search, selectedCategory, selectedBrand, selectedSort]);

  const displayedList = filteredProducts.slice(0, visibleCount);

  const handleToggleWishlist = (id) => {
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="page shop-page">
      <div className="container">
        {/* Header */}
        <div className="shop-header">
          <div>
            <p className="eyebrow">CURATED CATALOGUE</p>
            <h1>{pageTitle || 'The Collection'}</h1>
            <p className="page-subtitle">
              Authentic brands, verified availability. Enquire directly before purchasing.
            </p>
          </div>
          <div className="shop-stats-badge">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Piece' : 'Pieces'} available
          </div>
        </div>

        {/* Filter Bar */}
        <div className="shop-filter-bar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by piece, brand or style..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                updateParam('q', e.target.value);
              }}
            />
            {search && (
              <button
                className="clear-icon"
                onClick={() => {
                  setSearch('');
                  updateParam('q', '');
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="filter-controls">
            {/* Category Dropdown (if not forced by subpage) */}
            {!defaultCategory && (
              <div className="select-wrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    updateParam('category', e.target.value);
                  }}
                  aria-label="Filter by Category"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Brand Dropdown */}
            <div className="select-wrap">
              <select
                value={selectedBrand}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  updateParam('brand', e.target.value);
                }}
                aria-label="Filter by Brand"
              >
                <option value="All">All Brands</option>
                {brands.map(b => (
                  <option key={b.id || b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="select-wrap">
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  updateParam('sort', e.target.value);
                }}
                aria-label="Sort products"
              >
                <option value="featured">Featured First</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button className="btn btn-outline btn-sm" onClick={clearAllFilters}>
                <RotateCcw size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="page-loading"><span className="spinner" /></div>
        ) : error ? (
          <div className="error-state">
            <Package size={36} />
            <h3>Unable to load collection</h3>
            <p>{error}</p>
            <button className="btn btn-dark" onClick={loadData}>Try Again</button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <Package size={36} />
            <h3>No matching pieces found</h3>
            <p>Try clearing filters or searching for another brand or product name.</p>
            {hasActiveFilters && (
              <button className="btn btn-dark" onClick={clearAllFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="product-grid">
              {displayedList.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={wishlist.includes(product.id)}
                  onToggleWishlist={handleToggleWishlist}
                  onEnquire={(prod) => setSelectedProduct(prod)}
                />
              ))}
            </div>

            {displayedList.length < filteredProducts.length && (
              <div className="load-more-wrap">
                <button
                  className="btn btn-outline"
                  onClick={() => setVisibleCount(prev => prev + 12)}
                >
                  Load More Pieces ({filteredProducts.length - displayedList.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Enquiry Modal */}
      <EnquiryModal
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
