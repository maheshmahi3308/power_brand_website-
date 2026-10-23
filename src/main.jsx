import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import './styles.css';

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Public pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import BrandList from './pages/BrandList';
import ProductDetail from './pages/ProductDetail';
import NewArrivals from './pages/NewArrivals';
import Offers from './pages/Offers';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Shipping from './pages/Shipping';
import NotFound from './pages/NotFound';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Customer Account pages
import AccountDashboard from './pages/account/Dashboard';
import AccountEnquiries from './pages/account/Enquiries';
import EnquiryDetail from './pages/account/EnquiryDetail';
import AccountProfile from './pages/account/Profile';
import Wishlist from './pages/account/Wishlist';

// Admin pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/Products';
import AdminBrands from './pages/admin/Brands';
import AdminCategories from './pages/admin/Categories';
import AdminInventory from './pages/admin/Inventory';
import AdminEnquiries from './pages/admin/Enquiries';
import AdminCustomers from './pages/admin/Customers';
import AdminContent from './pages/admin/Content';
import AdminProfile from './pages/admin/Profile';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Storefront Layout (Public + Account Pages) */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/brands" element={<BrandList />} />
              <Route path="/men" element={<Shop defaultCategory="Men" pageTitle="Men's Fashion" />} />
              <Route path="/women" element={<Shop defaultCategory="Women" pageTitle="Women's Fashion" />} />
              <Route path="/kids" element={<Shop defaultCategory="Kids" pageTitle="Small Kids Collection" />} />
              <Route path="/footwear" element={<Navigate to="/shop" replace />} />
              <Route path="/accessories" element={<Navigate to="/shop" replace />} />
              <Route path="/new-arrivals" element={<NewArrivals />} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/shipping" element={<Shipping />} />

              {/* Customer Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Customer Account Routes */}
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <AccountDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/enquiries"
                element={
                  <ProtectedRoute>
                    <AccountEnquiries />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/enquiries/:id"
                element={
                  <ProtectedRoute>
                    <EnquiryDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/profile"
                element={
                  <ProtectedRoute>
                    <AccountProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/wishlist"
                element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />

              {/* 404 within Layout */}
              <Route path="*" element={<NotFound />} />
            </Route>

            {/* Separate Admin Portal Authentication */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Admin Dashboard with Left Sidebar Layout */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="brands" element={<AdminBrands />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="enquiries" element={<AdminEnquiries />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
