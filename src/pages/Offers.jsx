import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ProductCard from '../components/ui/ProductCard';
import EnquiryModal from '../components/ui/EnquiryModal';
import { Package, Tag } from 'lucide-react';

export default function Offers() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    document.title = 'Offers & Special Pricing — FORME';
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // Find products with valid sale_price or is_on_offer
      const { data, error } = await supabase
        .from('products')
        .select('*, brands(name)')
        .eq('is_published', true)
        .not('sale_price', 'is', null)
        .order('created_at', { ascending: false });

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
            <p className="eyebrow">CURATED VALUES</p>
            <h1>Offers &amp; Special Pricing</h1>
            <p className="page-subtitle">Real admin-configured reductions on genuine branded apparel and footwear.</p>
          </div>
          <div className="shop-stats-badge">{products.length} Offers in View</div>
        </div>

        {loading ? (
          <div className="page-loading"><span className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <Tag size={32} />
            <h3>No promotional offers active right now</h3>
            <p>All items are sold at competitive fair prices. Check back soon for seasonal edits.</p>
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
