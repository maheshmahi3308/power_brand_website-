import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowUpRight, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { money } from '../../lib/money';
import ProductCard, { imageFor } from '../../components/ui/ProductCard';
import EnquiryModal from '../../components/ui/EnquiryModal';
import { useToast } from '../../context/ToastContext';

export default function Wishlist() {
  const { user } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enquiryProduct, setEnquiryProduct] = useState(null);

  useEffect(() => {
    document.title = 'Wishlist — FORME';
    if (!supabase || !user) return;
    loadWishlist();
  }, [user]);

  const loadWishlist = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('product_id, products(id, name, slug, price, sale_price, image_url, images, brands(name), availability, sizes, colors, is_featured, is_new_arrival, is_on_offer)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setItems((data || []).map((d) => ({
        ...d.products,
        brand_name: d.products?.brands?.name || '',
        display_image: d.products?.image_url || d.products?.images?.[0] || '',
      })));
    }
    setLoading(false);
  };

  const removeFromWishlist = async (productId) => {
    if (!supabase || !user) return;
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    if (error) toast(error.message, 'error');
    else {
      setItems((prev) => prev.filter((p) => p.id !== productId));
      toast('Removed from wishlist.', 'success');
    }
  };

  return (
    <div className="page account-page">
      <div className="container">
        <div className="page-header">
          <div>
            <p className="eyebrow">MY ACCOUNT</p>
            <h1>My Wishlist</h1>
            <p className="page-subtitle">Products you've saved for later.</p>
          </div>
          <Link to="/shop" className="btn btn-outline">
            Continue Shopping <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="page-loading"><span className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <Heart size={36} />
            <h3>Your wishlist is empty</h3>
            <p>Browse products and tap the heart icon to save them here.</p>
            <Link to="/shop" className="btn btn-dark">Browse Collection <ArrowUpRight size={14} /></Link>
          </div>
        ) : (
          <div className="product-grid">
            {items.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={true}
                onToggleWishlist={() => removeFromWishlist(product.id)}
                onEnquire={() => setEnquiryProduct(product)}
              />
            ))}
          </div>
        )}

        <EnquiryModal
          product={enquiryProduct}
          open={Boolean(enquiryProduct)}
          onClose={() => setEnquiryProduct(null)}
        />
      </div>
    </div>
  );
}
