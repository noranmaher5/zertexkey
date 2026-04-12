import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import HomePage        from './pages/HomePage';
import ProductsPage    from './pages/ProductsPage';
import ProductDetail   from './pages/ProductDetail';
import CartPage        from './pages/CartPage';
import CheckoutPage    from './pages/CheckoutPage';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import ProfilePage     from './pages/ProfilePage';
import OrdersPage      from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AdminDashboard  from './pages/admin/AdminDashboard';
import AdminProducts   from './pages/admin/AdminProducts';
import AdminOrders     from './pages/admin/AdminOrders';
import AdminUsers      from './pages/admin/AdminUsers';
import AdminCodes      from './pages/admin/AdminCodes';
import NotFoundPage    from './pages/NotFoundPage';
import TermsPage       from './pages/TermsPage';
import PrivacyPage     from './pages/PrivacyPage';

// Guards
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children, minRole = 'admin' }) => {
  const { hasRole, loading } = useAuth();
  if (loading) return null;
  return hasRole(minRole) ? children : <Navigate to="/" replace />;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  return (
    <div
      className="flex flex-col min-h-screen bg-surface-900"
      style={{ overflowX: 'hidden' }} // ✅
    >
      <Navbar />
      <main className="flex-1" style={{ minWidth: 0, overflowX: 'hidden' }}> {/* ✅ */}
        <Routes>
          {/* Public */}
          <Route path="/"             element={<HomePage />} />
          <Route path="/products"     element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart"         element={<CartPage />} />
          <Route path="/terms"        element={<TermsPage />} />
          <Route path="/privacy"      element={<PrivacyPage />} />

          {/* Auth */}
          <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

          {/* Protected */}
          <Route path="/checkout"   element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="/profile"    element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/orders"     element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute minRole="editor"><AdminProducts /></AdminRoute>} />
          <Route path="/admin/orders"   element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/users"    element={<AdminRoute minRole="manager"><AdminUsers /></AdminRoute>} />
          <Route path="/admin/codes"    element={<AdminRoute><AdminCodes /></AdminRoute>} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <style>{`
            @keyframes toastSlideIn {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes toastSlideOut {
              from {
                opacity: 1;
                transform: translateY(0);
              }
              to {
                opacity: 0;
                transform: translateY(-20px);
              }
            }
            @keyframes checkmarkBounce {
              0% {
                transform: scale(0) rotate(-45deg);
                opacity: 0;
              }
              50% {
                transform: scale(1.2) rotate(0deg);
              }
              100% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
              }
            }
            @keyframes checkmarkPulse {
              0%, 100% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.1);
              }
            }
          `}</style>
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#182512',
                color: '#e8f0e0',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                fontFamily: 'Outfit, sans-serif',
                fontSize: '14px',
                fontWeight: '500',
                padding: '14px 20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                animation: 'toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(8px)',
              },
              success: {
                style: {
                  background: '#1f3a28',
                  border: '1px solid rgba(34, 197, 94, 0.5)',
                  color: '#86efac',
                },
                icon: (
                  <div style={{
                    animation: 'checkmarkBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
                  }}>
                    ✓
                  </div>
                ),
                duration: 3500,
              },
              error: {
                style: {
                  background: '#3a1f1f',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: '#fca5a5',
                },
                iconTheme: { primary: '#ef4444', secondary: '#3a1f1f' },
                duration: 4000,
              },
              loading: {
                style: {
                  background: '#1f2a3a',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  color: '#93c5fd',
                },
                iconTheme: { primary: '#3b82f6', secondary: '#1f2a3a' },
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}