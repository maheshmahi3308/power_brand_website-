import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, MessageCircle, Heart, ShieldCheck,
  Package, Truck, ArrowUpRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { money, discountPct } from '../lib/money';
import { CONTACT, productWhatsappUrl } from '../lib/contact';
import EnquiryModal from '../components/ui/EnquiryModal';
import ProductCard from '../components/ui/ProductCard';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    loadProduct();
  }, [slug]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // Find by slug or id
      let query = supabase
        .from('products')
        .select('*, brands(name, slug, description)')
        .eq('is_published', true);

      // Check if slug looks like a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (isUUID) {
        query = query.eq('id', slug);
      } else {
        query = query.eq('slug', slug);
      }

      const { data, error: pError } = await query.maybeSingle();

      if (pError) throw pError;
      if (!data) {
        setError('Product not found or is currently unavailable.');
        setLoading(false);
        return;
      }

      const prod = {
        ...data,
        brand_name: data.brands?.name || 'Brand',
        display_image: data.image_url || data.images?.[0] || FALLBACK_IMAGE
      };

      setProduct(prod);
      setActiveImage(prod.display_image);
      setSelectedSize(prod.sizes?.[0] || '');
      setSelectedColor(prod.colors?.[0] || '');
      document.title = `${prod.name} | ${prod.brand_name} — FORME`;

      // Load related products
      if (prod.category) {
        const { data: relData } = await supabase
          .from('products')
          .select('*, brands(name)')
          .eq('is_published', true)
          .eq('category', prod.category)
          .neq('id', prod.id)
          .limit(4);

        if (relData) {
          setRelatedProducts(relData.map(r => ({
            ...r,
            brand_name: r.brands?.name || 'Brand',
            display_image: r.image_url || r.images?.[0] || ''
          })));
        }
      }
    } catch (err) {
      console.error('Failed to load product:', err);
      setError(err.message || 'Error loading product details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-loading"><span className="spinner" /></div>;
  }

  if (error || !product) {
    return (
      <div className="page">
        <div className="container">
          <div className="error-state">
            <Package size={40} />
            <h2>Product Not Found</h2>
            <p>{error || 'This product is no longer active in our catalogue.'}</p>
            <Link to="/shop" className="btn btn-dark">
              <ArrowLeft size={16} /> Return to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const galleryImages = [
    product.display_image,
    ...(product.images || []).filter(img => img && img !== product.display_image)
  ].filter(Boolean);

  const pct = discountPct(product.price, product.sale_price);

  return (
    <div className="page product-detail-page">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>
            {product.category}
          </Link>
          <span>/</span>
          <span className="current">{product.name}</span>
        </nav>

        {/* Product Layout Grid */}
        <div className="product-layout">
          {/* Gallery Column */}
          <div className="product-gallery">
            <div className="main-image-wrap">
              <img
                src={activeImage || FALLBACK_IMAGE}
                alt={product.name}
                className="main-product-img"
                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
              />
              {product.is_new_arrival && (
                <span className="product-badge badge-new">New Arrival</span>
              )}
              {pct > 0 && (
                <span className="product-badge badge-offer">-{pct}% OFF</span>
              )}
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="gallery-thumbs">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    className={`thumb-btn ${activeImage === img ? 'active' : ''}`}
                    onClick={() => setActiveImage(img)}
                  >
                    <img src={img} alt={`${product.name} view ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="product-info-col">
            <div className="product-header-block">
              <Link
                to={`/shop?brand=${encodeURIComponent(product.brand_name)}`}
                className="brand-pill-link"
              >
                {product.brand_name}
              </Link>
              <h1 className="product-title">{product.name}</h1>
              {product.sku && <span className="product-sku">SKU: {product.sku}</span>}
            </div>

            {/* Pricing */}
            <div className="product-pricing">
              <span className="current-price">
                {money(product.sale_price || product.price)}
              </span>
              {product.sale_price && product.sale_price < product.price && (
                <>
                  <del className="original-price">{money(product.price)}</del>
                  <span className="discount-tag">Save {pct}%</span>
                </>
              )}
            </div>

            {/* Availability Badge */}
            <div className="availability-row">
              <span className={`availability-dot ${product.availability === 'Available' ? 'available' : 'checking'}`} />
              <span className="availability-label">
                {product.availability || 'Check availability with team'}
              </span>
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p className="product-short-desc">{product.short_description}</p>
            )}

            {/* Sizing selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="variant-section">
                <div className="variant-label-row">
                  <span>Available Sizes</span>
                  {selectedSize && <strong>{selectedSize}</strong>}
                </div>
                <div className="chip-group">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`variant-chip ${selectedSize === s ? 'active' : ''}`}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="variant-section">
                <div className="variant-label-row">
                  <span>Available Colors</span>
                  {selectedColor && <strong>{selectedColor}</strong>}
                </div>
                <div className="chip-group">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`variant-chip ${selectedColor === c ? 'active' : ''}`}
                      onClick={() => setSelectedColor(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PRIMARY PURCHASE WORKFLOW: ENQUIRY BUTTONS */}
            <div className="purchase-action-block">
              <button
                className="btn btn-dark btn-lg full-width enquiry-main-btn"
                onClick={() => setEnquiryOpen(true)}
              >
                Enquire About This Product <ArrowUpRight size={18} />
              </button>

              <div className="direct-contact-action-row">
                <a
                  href={CONTACT.phoneHref}
                  className="btn btn-outline direct-btn"
                  title={`Call ${CONTACT.name}`}
                >
                  <Phone size={16} /> Call Now ({CONTACT.phone})
                </a>
                <a
                  href={productWhatsappUrl(product.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp direct-btn"
                  title="WhatsApp Enquiry"
                >
                  <MessageCircle size={16} /> WhatsApp Enquiry
                </a>
              </div>

              <div className="enquiry-guarantee-note">
                <ShieldCheck size={16} />
                <span>
                  No direct checkout or advance card payment required. We verify size and stock availability before confirming any order.
                </span>
              </div>
            </div>

            {/* Full Description & Specs */}
            <div className="product-description-block">
              <h3>About this piece</h3>
              <p>
                {product.description ||
                  `Carefully crafted by ${product.brand_name}, combining contemporary aesthetics with enduring quality. For exact sizing guidance or fabric composition, speak directly with our team.`}
              </p>
            </div>

            {/* Dedicated Contact Person Card */}
            <div className="contact-person-card">
              <div className="contact-person-avatar">YR</div>
              <div className="contact-person-info">
                <span className="contact-person-role">Store Manager &amp; Brand Consultant</span>
                <strong>{CONTACT.name}</strong>
                <p>Ready to confirm real-time availability, sizing, and pricing for this item.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">EXPLORE MORE</p>
                <h2>More in <em>{product.category}.</em></h2>
              </div>
              <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="text-link">
                View all {product.category} <span>↗</span>
              </Link>
            </div>

            <div className="product-grid">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isWishlisted={false}
                  onEnquire={(prod) => {
                    setProduct(prod);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      <EnquiryModal
        product={product}
        open={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
      />
    </div>
  );
}
