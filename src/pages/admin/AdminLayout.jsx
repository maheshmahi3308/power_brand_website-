import React from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tag, FolderTree, Boxes,
  Inbox, Users, Settings, LogOut, ArrowUpRight,
  ShieldCheck, ExternalLink, User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const NAV_ITEMS = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Products', to: '/admin/products', icon: Package },
  { label: 'Brands', to: '/admin/brands', icon: Tag },
  { label: 'Categories', to: '/admin/categories', icon: FolderTree },
  { label: 'Inventory', to: '/admin/inventory', icon: Boxes },
  { label: 'Enquiries', to: '/admin/enquiries', icon: Inbox },
  { label: 'Customers', to: '/admin/customers', icon: Users },
  { label: 'Site Content', to: '/admin/content', icon: Settings },
  { label: 'Admin Profile', to: '/admin/profile', icon: User }
];

export default function AdminLayout() {
  const { profile, session, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast('Logged out of Admin Portal.', 'success');
    navigate('/admin/login');
  };

  const adminName = profile?.full_name || session?.user?.email?.split('@')[0] || 'Administrator';

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link to="/admin" className="wordmark">FORME<span>®</span></Link>
          <span className="admin-badge">CONTROL PANEL</span>
        </div>

        <nav className="admin-nav" aria-label="Admin Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <span className="admin-role-tag"><ShieldCheck size={12} /> Verified Admin</span>
            <strong className="admin-user-name">{adminName}</strong>
            <span className="admin-user-email">{session?.user?.email}</span>
          </div>

          <div className="admin-footer-actions">
            <Link to="/" target="_blank" rel="noopener noreferrer" className="admin-store-link">
              <span>View Storefront</span> <ExternalLink size={13} />
            </Link>
            <button className="admin-logout-btn" onClick={handleSignOut} title="Sign Out">
              <LogOut size={15} /> <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <span>FORME Management System</span>
          </div>
          <div className="admin-topbar-right">
            <Link to="/" className="btn btn-outline btn-sm">
              View Storefront <ExternalLink size={12} />
            </Link>
          </div>
        </header>

        <main className="admin-content-pane">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
