import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { systemAPI } from './services/api';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCodes from './pages/admin/AdminCodes';
import AdminSettings from './pages/admin/AdminSettings';
import NotFoundPage from './pages/NotFoundPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import MaintenancePage from './pages/MaintenancePage'; 
import AdminFinancials from './pages/admin/AdminFinancials';
import AdminDiscounts from './pages/admin/AdminDiscounts';


// 💬 Chatwoot Widget (كل الصفحات ما عدا /admin)
const ChatwootScript = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    const styleId = 'chatwoot-hide-style';

    if (isAdmin) {
      // إخفاء كل عناصر Chatwoot عبر CSS
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          #chatwoot_live_chat_widget,
          .woot-widget-bubble,
          .woot-widget-holder { display: none !important; visibility: hidden !important; }
        `;
        document.head.appendChild(style);
      }
      return;
    }

    // إزالة الـ hide style لو رجع من الأدمن
    const hideStyle = document.getElementById(styleId);
    if (hideStyle) hideStyle.remove();

    // امنع التكرار لو السكريبت موجود بالفعل
    if (document.getElementById('chatwoot-sdk')) return;

    const BASE_URL = 'https://app-bot.syriana.software';
    const script = document.createElement('script');
    script.id = 'chatwoot-sdk';
    script.src = `${BASE_URL}/packs/js/sdk.js`;
    script.async = true;
    script.onload = () => {
      window.chatwootSDK.run({
        websiteToken: 'ahHbRPEmY3BmUtGyuGZqTAWo',
        baseUrl: BASE_URL,
      });
      window.addEventListener('chatwoot:ready', () => {
        const style = document.createElement('style');
        style.innerHTML = `
          #chatwoot_live_chat_widget { clip-path: inset(0px 0px 35px 0px) !important; bottom: -15px !important; }
          .woot-widget-bubble--brand { display: none !important; visibility: hidden !important; }
        `;
        document.head.appendChild(style);

        // نستنى الـ widget يتحمل كامل الأول
        setTimeout(() => {
          const interval = setInterval(() => {
            try {
              const widgetHolder = document.querySelector('.woot-widget-holder');
              if (widgetHolder && !widgetHolder.querySelector('.clean-cover')) {
                const cover = document.createElement('div');
                cover.className = 'clean-cover';
                cover.style.cssText = `
                  position: absolute; bottom: 0; right: 0;
                  width: 100%; height: 35px; background: #fff;
                  z-index: 9999; pointer-events: none;
                  border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;
                `;
                widgetHolder.appendChild(cover);
                clearInterval(interval); // خلاص لقيناه، وقفنا الـ interval
              }
            } catch (e) {
              // ignore
            }
          }, 1500);
        }, 2000);
      });
    };
    document.body.appendChild(script);
  }, [isAdmin]);

  return null;
};

// 🛡️ 1. جارد وضع الصيانة (Maintenance Guard)
const MaintenanceGuard = () => {
  // ✅ أضفنا user هنا لضمان عمل فحص الرتبة بنجاح
  const { user, loading: authLoading } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [checking, setChecking] = useState(true);
  const [lang, setLang] = useState('ar');

  useEffect(() => {
    const checkStatus = () => {
      systemAPI.health(`?t=${Date.now()}`)
        .then(res => setIsMaintenance(res.data.maintenanceMode || false))
        .catch(() => setIsMaintenance(false))
        .finally(() => setChecking(false));
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (checking || authLoading) return null;

  // ✅ السماح للأدمن، الأونر، والرتبة المخفية بتخطي شاشة الصيانة
  const canBypassMaintenance = user && ['admin', 'owner', 'hidden'].includes(user.role);

  if (isMaintenance && !canBypassMaintenance) {
    return (
      <div className={`fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center font-sans overflow-hidden ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          className="absolute top-8 right-8 z-[10000] px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white text-[10px] font-bold tracking-[2px] hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-md uppercase"
        >
          {lang === 'ar' ? 'English' : 'العربية'}
        </button>

        <div className="absolute w-[300px] h-[300px] bg-[#22c55e]/10 blur-[100px] rounded-full" />
        <div className="relative z-10 text-center">
          <div className="relative inline-block mb-8">
            <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
              <span className="text-6xl animate-[hammer_1s_infinite]">🔨</span>
            </div>
            <div className="absolute -right-2 -top-2 w-4 h-4 bg-[#22c55e] rounded-full animate-ping" />
          </div>
          <h1 className="text-white text-4xl font-black tracking-tight mb-2 uppercase">
            {lang === 'ar' ? (<>وضع <span className="text-[#22c55e]">الصيانة</span></>) : (<>Under <span className="text-[#22c55e]">Maintenance</span></>)}
          </h1>
          <p className="text-gray-500 font-medium tracking-widest text-[10px] uppercase mb-10">
            {lang === 'ar' ? 'نعمل على بناء شيء أسطوري من أجلك' : 'Building something legendary for you'}
          </p>
          <div className="w-48 h-[2px] bg-white/10 mx-auto relative overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-[#22c55e] animate-[loading_2s_infinite] origin-left" style={{ width: '40%' }} />
          </div>
        </div>
        <style>{`
          @keyframes hammer { 0%, 100% { transform: rotate(-20deg) translateY(0); } 50% { transform: rotate(15deg) translateY(-10px); } }
          @keyframes loading { 0% { transform: translateX(-250%); } 100% { transform: translateX(250%); } }
          .rtl { direction: rtl; font-family: 'Cairo', 'Tahoma', sans-serif; }
          .ltr { direction: ltr; }
          .rtl .animate-[loading_2s_infinite] { left: 0; right: auto; }
        `}</style>
      </div>
    );
  }

  return <Outlet />;
};

// 🔒 Guards الحماية
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ✅ تعديل جارد الإدارة ليدعم الرتبة المخفية "hidden"
const AdminRoute = ({ children, permission }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) return <div className="loading-screen">LOADING...</div>;

  // 1. التحقق من أن المستخدم لديه رتبة إدارية معترف بها
  const isAuthorizedAdmin = user && ['admin', 'owner', 'hidden'].includes(user.role);

  if (!isAuthorizedAdmin) {
    return <Navigate to="/login" />;
  }

  // 2. إذا كانت الرتبة "hidden"، يتم تخطي فحص الصلاحيات الفرعية (وصول كامل)
  if (user.role === 'hidden') {
    return children;
  }

  // 3. لباقي الرتب، يتم التحقق من الصلاحية المطلوبة لكل صفحة
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/admin" />;
  }

  return children;
};

const GuestRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  return (
    <div className="flex flex-col min-h-screen bg-[#050505] overflow-x-hidden">
      <ChatwootScript />
      <Navbar />
      <main className="flex-1 min-w-0">
        <Routes>
          {/* Guest Routes */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
          <Route path="/reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

          {/* Maintenance Protected Routes */}
          <Route element={<MaintenanceGuard />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<PrivateRoute><WishlistPage /></PrivateRoute>} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* User Protected Routes */}
            <Route path="/checkout" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
            <Route path="/orders/:id" element={<PrivateRoute><OrderDetailPage /></PrivateRoute>} />

            {/* Admin Dashboard Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            
            <Route path="/admin/products" element={
              <AdminRoute permission="manage_products">
                <AdminProducts />
              </AdminRoute>
            } />
            
            <Route path="/admin/orders" element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            } />

            <Route path="/admin/users" element={
              <AdminRoute permission="manage_users">
                <AdminUsers />
              </AdminRoute>
            } />

            <Route path="/admin/codes" element={
              <AdminRoute>
                <AdminCodes />
              </AdminRoute>
            } />

            <Route path="/admin/financials" element={
              <AdminRoute permission="view_ledger">
                <AdminFinancials />
              </AdminRoute>
            } />

            <Route path="/admin/settings" element={
              <AdminRoute permission="manage_settings">
                <AdminSettings />
              </AdminRoute>
            } />
            <Route path="/admin/discounts" element={<AdminRoute><AdminDiscounts /></AdminRoute>} />


            <Route path="/admin/maintenance" element={
              <AdminRoute permission="manage_maintenance">
                <MaintenancePage />
              </AdminRoute>
            } />
          </Route>

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
          <Toaster position="top-right" />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}