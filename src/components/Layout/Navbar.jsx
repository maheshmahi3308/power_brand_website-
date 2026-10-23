import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Search, UserRound, Menu, X, ShieldCheck, LogOut,
  ChevronDown, Heart, Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const NAV_LINKS = [
  { label: 'Shop All', to: '/shop' },
  {
    label: 'Categories',
    children: [
      { label: "Men's Fashion", to: '/men' },
      { label: "Women's Fashion", to: '/women' },
      { label: "Small Kids", to: '/kids' },
    ],
  },
  { label: 'Brands', to: '/brands' },
  { label: 'New Arrivals', to: '/new-arrivals' },
  { label: 'Offers', to: '/offers' },
];

export default function Navbar() {
  const { isAuthenticated, isAdmin, profile, session, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);

  // Add scrolled class for background change
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on navigation
  const closeAll = () => {
    setMobileOpen(false);
    setSearchOpen(false);
    setDropdownOpen(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      closeAll();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast('You have been signed out.', 'success');
    navigate('/');
    closeAll();
  };

  const displayName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Account';

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      {/* Mobile menu toggle */}
      <button
        className="icon-btn mobile-only"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo */}
      <Link to="/" className="wordmark" onClick={closeAll} aria-label="FORME — Home">
        FORME<span>®</span>
      </Link>

      {/* Desktop navigation */}
      <nav className="nav desktop-nav" aria-label="Main navigation">
        {NAV_LINKS.map((item) =>
          item.children ? (
            <div
              key={item.label}
              className="nav-dropdown-wrapper"
              onMouseEnter={() => setDropdownOpen(item.label)}
              onMouseLeave={() => setDropdownOpen(null)}
            >
              <button className="nav-link nav-dropdown-btn" aria-haspopup="true">
                {item.label} <ChevronDown size={13} />
              </button>
              {dropdownOpen === item.label && (
                <div className="nav-dropdown" role="menu">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className="nav-dropdown-item"
                      role="menuitem"
                      onClick={closeAll}
                    >
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}
              onClick={closeAll}
            >
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      {/* Header actions */}
      <div className="header-actions">
        {/* Search */}
        <div className={`search-inline ${searchOpen ? 'search-inline-open' : ''}`}>
          {searchOpen ? (
            <form onSubmit={handleSearch} className="search-form">
              <Search size={16} />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands…"
                autoFocus
                aria-label="Search"
              />
              <button type="button" className="icon-btn" onClick={() => setSearchOpen(false)} aria-label="Close search">
                <X size={16} />
              </button>
            </form>
          ) : (
            <button
              className="icon-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Open search"
            >
              <Search size={19} />
            </button>
          )}
        </div>

        {/* Account */}
        {isAuthenticated ? (
          <div className="account-menu-wrapper">
            <button className="account-btn" aria-label="Account menu">
              <UserRound size={19} />
              <span className="account-name">{displayName}</span>
            </button>
            <div className="account-dropdown">
              <Link to="/account" onClick={closeAll}>
                <Package size={14} /> My Account
              </Link>
              <Link to="/account/enquiries" onClick={closeAll}>
                <Package size={14} /> My Enquiries
              </Link>
              <Link to="/account/wishlist" onClick={closeAll}>
                <Heart size={14} /> Wishlist
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={closeAll} className="admin-link">
                  <ShieldCheck size={14} /> Admin Dashboard
                </Link>
              )}
              <button onClick={handleSignOut}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        ) : (
          <Link to="/login" className="icon-btn" aria-label="Sign in" onClick={closeAll}>
            <UserRound size={19} />
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin" className="admin-pill" onClick={closeAll}>
            <ShieldCheck size={13} /> Admin
          </Link>
        )}
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <div className="mobile-nav-inner">
            <form onSubmit={handleSearch} className="mobile-search-form">
              <Search size={16} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands…"
                aria-label="Search"
              />
            </form>
            <div className="mobile-nav-links">
              {NAV_LINKS.map((item) =>
                item.children ? (
                  <div key={item.label}>
                    <span className="mobile-nav-section">{item.label}</span>
                    {item.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className="mobile-nav-link indent"
                        onClick={closeAll}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="mobile-nav-link"
                    onClick={closeAll}
                  >
                    {item.label}
                  </NavLink>
                )
              )}
              <div className="mobile-nav-divider" />
              {isAuthenticated ? (
                <>
                  <NavLink to="/account" className="mobile-nav-link" onClick={closeAll}>My Account</NavLink>
                  <NavLink to="/account/enquiries" className="mobile-nav-link" onClick={closeAll}>My Enquiries</NavLink>
                  {isAdmin && <NavLink to="/admin" className="mobile-nav-link" onClick={closeAll}>Admin Dashboard</NavLink>}
                  <button className="mobile-nav-link mobile-signout" onClick={handleSignOut}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="mobile-nav-link" onClick={closeAll}>Sign In</NavLink>
                  <NavLink to="/register" className="mobile-nav-link" onClick={closeAll}>Create Account</NavLink>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
      {mobileOpen && <div className="mobile-overlay" onClick={closeAll} />}
    </header>
  );
}
