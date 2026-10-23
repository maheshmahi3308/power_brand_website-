import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, Phone, MessageCircle, ShieldCheck,
  Package, Heart, Sparkles, CheckCircle2, ChevronRight,
  TrendingUp, Tag, HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { money } from '../lib/money';
import { CONTACT, whatsappUrl, productWhatsappUrl } from '../lib/contact';
import ProductCard from '../components/ui/ProductCard';
import EnquiryModal from '../components/ui/EnquiryModal';

const CATEGORIES = [
  {
    name: "Men's Fashion",
    to: "/men",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=80",
    description: "Tees, shirts, denim, trousers & tailored essentials"
  },
  {
    name: "Women's Fashion",
    to: "/women",
    image: "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=700&q=80",
    description: "Dresses, jackets, tops, co-ords & relaxed styles"
  },
  {
    name: "Small Kids",
    to: "/kids",
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=700&q=80",
    description: "Comfortable, playful branded outfits for boys & girls"
  }
];

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [offerProducts, setOfferProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    document.title = 'FORME — Your Style. Your Brands. Better Choices.';
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch published brands
      const { data: bData } = await supabase
        .from('brands')
        .select('*')
        .eq('is_published', true)
        .order('name');
      if (bData && bData.length > 0) setBrands(bData);
      else setBrands([]);

      // 2. Fetch featured products
      const { data: fData } = await supabase
        .from('products')
        .select('*, brands(name)')
        .eq('is_published', true)
        .eq('is_featured', true)
        .limit(8);

      if (fData) {
        setFeaturedProducts(fData.map(p => ({
          ...p,
          brand_name: p.brands?.name || 'Brand',
          display_image: p.image_url || p.images?.[0] || ''
        })));
      }

      // 3. Fetch new arrivals
      const { data: nData } = await supabase
        .from('products')
        .select('*, brands(name)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (nData) {
        setNewArrivals(nData.map(p => ({
          ...p,
          brand_name: p.brands?.name || 'Brand',
          display_image: p.image_url || p.images?.[0] || ''
        })));
      }

      // 4. Fetch offers
      const { data: oData } = await supabase
        .from('products')
        .select('*, brands(name)')
        .eq('is_published', true)
        .not('sale_price', 'is', null)
        .limit(4);

      if (oData) {
        setOfferProducts(oData.map(p => ({
          ...p,
          brand_name: p.brands?.name || 'Brand',
          display_image: p.image_url || p.images?.[0] || ''
        })));
      }
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = (id) => {
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="home-page">
      {/* ── HERO BANNER ── */}
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">THE NEW WAY TO SHOP BRANDS</p>
          <h1>Your Style.<br />Your Brands.<br /><em>Better Choices.</em></h1>
          <p className="hero-text">
            Discover branded fashion, explore your favorite styles, and contact our team to enquire about availability, sizing, and pricing before you purchase.
          </p>
          <div className="hero-actions">
            <Link to="/shop" className="btn btn-dark">
              Explore Collection <ArrowUpRight size={17} />
            </Link>
            <a href="#how" className="text-link">
              How Enquiries Work <span>↗</span>
            </a>
          </div>
          <div className="hero-footnote">
            <span className="tiny-dot" /> PERSONAL SERVICE &nbsp;·&nbsp; THOUGHTFUL PRICES &nbsp;·&nbsp; DIRECT ASSISTANCE
          </div>
        </div>

        <div className="hero-visual">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1500&q=90"
            alt="Curated branded fashion collection"
            loading="eager"
          />
          <div className="image-note">
            <span>THE CURATED EDIT</span>
            <strong>Style, on your terms.</strong>
          </div>
          <div className="hero-stamp">
            DIRECT<br />ENQUIRY<br />MODEL
          </div>
        </div>
      </section>

      {/* ── BRAND STRIP ── */}
      {brands.length > 0 && (
        <section className="brand-strip" id="brands">
          <div className="strip-label">EXPLORE CURATED BRANDS</div>
          <div className="brand-strip-names">
            {brands.map((b) => (
              <Link
                key={b.id || b.name}
                to={`/shop?brand=${encodeURIComponent(b.name)}`}
                className="brand-name"
              >
                {b.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── SHOP BY CATEGORY ── */}
      <section className="section category-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CURATED SELECTIONS</p>
              <h2>Shop by <em>Category.</em></h2>
            </div>
            <p className="section-desc">
              Browse by aesthetic and department. Inquire directly about sizing, fit, and seasonal stock.
            </p>
          </div>

          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <Link to={cat.to} key={cat.name} className="category-card">
                <div className="category-img-wrap">
                  <img src={cat.image} alt={cat.name} loading="lazy" />
                  <div className="category-overlay">
                    <span className="category-cta">Explore <ArrowUpRight size={14} /></span>
                  </div>
                </div>
                <div className="category-info">
                  <h3>{cat.name}</h3>
                  <p>{cat.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED & TRENDING PRODUCTS ── */}
      <section className="section products-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">HANDPICKED HIGHLIGHTS</p>
              <h2>Trending <em>Pieces.</em></h2>
            </div>
            <Link to="/shop" className="btn btn-outline">
              View All Pieces <ArrowUpRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="page-loading"><span className="spinner" /></div>
          ) : featuredProducts.length > 0 ? (
            <div className="product-grid">
              {featuredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isWishlisted={wishlist.includes(p.id)}
                  onToggleWishlist={handleToggleWishlist}
                  onEnquire={(prod) => setSelectedProduct(prod)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Package size={32} />
              <h3>Catalogue is being updated</h3>
              <p>Explore all available products or reach out with your requirements.</p>
              <Link to="/shop" className="btn btn-dark">Browse All</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW ENQUIRIES WORK ── */}
      <section className="how-section" id="how">
        <div className="how-image">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85"
            alt="Carefully curated fashion showroom"
            loading="lazy"
          />
          <div className="round-mark">
            EASY<br />ENQUIRY<br />PROCESS
          </div>
        </div>

        <div className="how-copy">
          <p className="eyebrow">SHOPPING WITHOUT THE GUESSWORK</p>
          <h2>How Product<br />Enquiries <em>Work.</em></h2>
          <p className="how-intro">
            No unexpected out-of-stock cancellations or sizing surprises. We verify each piece before you spend a single rupee.
          </p>

          <div className="steps">
            <div className="step">
              <span>01</span>
              <div>
                <h3>Explore and Select</h3>
                <p>Browse our catalogue of popular branded clothes, footwear, and accessories at fair prices.</p>
              </div>
            </div>
            <div className="step">
              <span>02</span>
              <div>
                <h3>Submit an Enquiry</h3>
                <p>Pick your desired size and color and tap "Enquire". Or reach out via Call or WhatsApp directly.</p>
              </div>
            </div>
            <div className="step">
              <span>03</span>
              <div>
                <h3>We Confirm &amp; Deliver</h3>
                <p>Our team verifies actual stock, confirms your sizing, final price, and organizes secure delivery.</p>
              </div>
            </div>
          </div>

          <div className="how-actions">
            <Link to="/shop" className="btn btn-dark">
              Find Your Piece <ArrowUpRight size={17} />
            </Link>
            <a href={`tel:${CONTACT.phone}`} className="btn btn-outline">
              <Phone size={15} /> Call {CONTACT.phone}
            </a>
          </div>
        </div>
      </section>

      {/* ── NEW ARRIVALS ── */}
      {newArrivals.length > 0 && (
        <section className="section bg-subtle">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">JUST ADDED</p>
                <h2>New <em>Arrivals.</em></h2>
              </div>
              <Link to="/new-arrivals" className="text-link">See all new arrivals <span>↗</span></Link>
            </div>

            <div className="product-grid">
              {newArrivals.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isWishlisted={wishlist.includes(p.id)}
                  onToggleWishlist={handleToggleWishlist}
                  onEnquire={(prod) => setSelectedProduct(prod)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── LATEST OFFERS (Only when configured) ── */}
      {offerProducts.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <div>
                <p className="eyebrow">SPECIAL VALUES</p>
                <h2>Curated <em>Offers.</em></h2>
              </div>
              <Link to="/offers" className="text-link">View all offers <span>↗</span></Link>
            </div>

            <div className="product-grid">
              {offerProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isWishlisted={wishlist.includes(p.id)}
                  onToggleWishlist={handleToggleWishlist}
                  onEnquire={(prod) => setSelectedProduct(prod)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── WHY CHOOSE US ── */}
      <section className="service-band">
        <div>
          <ShieldCheck size={26} />
          <h3>A More Personal Touch</h3>
          <p>Direct communication with our team before making any purchase.</p>
        </div>
        <div>
          <Package size={26} />
          <h3>Confirmed Availability</h3>
          <p>Every piece is checked for exact size and stock before taking orders.</p>
        </div>
        <div>
          <Heart size={26} />
          <h3>Zero Pressure Shopping</h3>
          <p>Browse freely without forced checkouts or pushy sales tactics.</p>
        </div>
      </section>

      {/* ── DIRECT CONTACT CTA ── */}
      <section className="contact-cta-section" id="contact-banner">
        <div className="container">
          <div className="contact-cta-card">
            <div className="contact-cta-text">
              <p className="eyebrow">SPEAK WITH US DIRECTLY</p>
              <h2>Have a specific brand or piece in mind?</h2>
              <p>
                Contact <strong>{CONTACT.name}</strong> directly via phone or WhatsApp to ask about availability, special requests, or sizing guidance.
              </p>
              <div className="contact-cta-buttons">
                <a href={CONTACT.phoneHref} className="btn btn-dark">
                  <Phone size={16} /> Call {CONTACT.phone}
                </a>
                <a
                  href={whatsappUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                >
                  <MessageCircle size={16} /> WhatsApp Enquiry
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enquiry Modal */}
      <EnquiryModal
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
