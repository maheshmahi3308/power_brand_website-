import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ui/ProductCard';
import EnquiryModal from '../components/ui/EnquiryModal';
import { Package } from 'lucide-react';

export default function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    document.title = 'New Arrivals — FORME';
    loadNewArrivals();
  }, []);

  const loadNewArrivals = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, brands(name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(24);

      if (error) throw error;

      setProducts((data || []).map(p => ({
        ...p,
        brand_name: p.brands?.name || 'Brand',
        display_image: p.image_url || p.images?.[0] || ''
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page shop-page">
      <div className="container">
        <div className="shop-header">
          <div>
            <p className="eyebrow">FRESH DROPS</p>
            <h1>New Arrivals</h1>
            <p className="page-subtitle">The latest branded apparel, footwear, and accessories added to our collection.</p>
          </div>
          <div className="shop-stats-badge">{products.length} New Pieces</div>
        </div>

        {loading ? (
          <div className="page-loading"><span className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <Package size={32} />
            <h3>No new arrivals found</h3>
            <p>Check back shortly as new items are added regularly.</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                isWishlisted={wishlist.includes(p.id)}
                onToggleWishlist={(id) => setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                onEnquire={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        )}
      </div>

      <EnquiryModal
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
