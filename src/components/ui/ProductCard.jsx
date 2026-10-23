import React from 'react';
import { ArrowUpRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { money, discountPct } from '../../lib/money';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80';

export function imageFor(product) {
  return (
    product?.display_image ||
    product?.image_url ||
    product?.images?.[0] ||
    FALLBACK_IMAGE
  );
}

export default function ProductCard({ product, onEnquire, isWishlisted, onToggleWishlist }) {
  const img = imageFor(product);
  const pct = discountPct(product.price, product.sale_price);
  const brandName = product.brand_name || product.brands?.name || '';

  return (
    <article className="product-card">
      <Link
        to={`/products/${product.slug || product.id}`}
        className="product-image-link"
        aria-label={`View ${product.name}`}
      >
        <div className="product-image">
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
          />
          {product.is_new_arrival && <span className="product-badge badge-new">New</span>}
          {product.is_on_offer && pct > 0 && (
            <span className="product-badge badge-offer">-{pct}%</span>
          )}
          {product.is_featured && !product.is_new_arrival && !product.is_on_offer && (
            <span className="product-badge badge-featured">Featured</span>
          )}
          <div className="product-quick-view">
            View piece <ArrowUpRight size={14} />
          </div>
        </div>
      </Link>

      <div className="product-meta">
        <div className="product-meta-top">
          {brandName && <span className="product-brand">{brandName}</span>}
          <h3 className="product-name">
            <Link to={`/products/${product.slug || product.id}`}>{product.name}</Link>
          </h3>
        </div>
        <button
          className={`heart-btn ${isWishlisted ? 'hearted' : ''}`}
          onClick={() => onToggleWishlist?.(product.id)}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={17} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="product-bottom">
        <div className="product-price">
          <strong>{money(product.sale_price || product.price)}</strong>
          {product.sale_price && product.sale_price < product.price && (
            <del>{money(product.price)}</del>
          )}
        </div>
        <button
          className="inquire-mini"
          onClick={() => onEnquire?.(product)}
          aria-label={`Enquire about ${product.name}`}
        >
          Enquire <ArrowUpRight size={13} />
        </button>
      </div>
    </article>
  );
}
