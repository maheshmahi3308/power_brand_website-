import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Package, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function BrandList() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'Brands We Carry — FORME';
    loadBrands();
  }, []);

  const loadBrands = async () => {
    setLoading(true);
    if (!supabase) {
      setBrands([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_published', true)
        .order('name');

      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      console.error('Failed to load brands:', err);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page brand-list-page">
      <div className="container">
        <div className="shop-header">
          <div>
            <p className="eyebrow">CURATED LABELS</p>
            <h1>Shop by Brand</h1>
            <p className="page-subtitle">
              Discover verified collections from your favorite fashion labels. Enquire about availability in any size or style.
            </p>
          </div>
          <div className="search-box brand-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search brands..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="page-loading"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Package size={36} />
            <h3>No brands found</h3>
            <p>Try searching for another brand name or view all pieces in our collection.</p>
            <Link to="/shop" className="btn btn-dark">Browse All Pieces</Link>
          </div>
        ) : (
          <div className="brand-grid">
            {filtered.map((b) => (
              <Link
                key={b.id || b.name}
                to={`/shop?brand=${encodeURIComponent(b.name)}`}
                className="brand-card"
              >
                <div className="brand-card-top">
                  <h2 className="brand-title">{b.name}</h2>
                  <span className="brand-arrow"><ArrowUpRight size={18} /></span>
                </div>
                <p className="brand-desc">
                  {b.description || `Browse curated ${b.name} apparel, footwear, and accessories.`}
                </p>
                <span className="brand-explore-btn">
                  Explore {b.name} Collection
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
