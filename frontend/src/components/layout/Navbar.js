import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import userDefaultAvatar from '../../assets/user.png';

const NavLinkItem = ({ to, children }) => {
  const { pathname } = useLocation();
  const active = pathname === to || (pathname.startsWith(to) && to !== '/');

  if (active) {
    return (
      <Link
        to={to}
        className="h-full flex items-center relative text-[14px] font-bold text-white transition-colors pt-1"
      >
        {children}
        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#567245] rounded-t-sm"></span>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className="h-full flex items-center relative text-[14px] font-medium text-[#889679] hover:text-white transition-colors pt-1"
    >
      {children}
    </Link>
  );
};

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setProfileOpen(false);

    if (profileOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [profileOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-[#10140c]/90 backdrop-blur-md border-b border-white/[0.03]'
          : 'bg-[#10140c]'
      }`}
    >
      <div className="max-w-[1300px] mx-auto px-4 lg:px-8 h-[64px] flex items-center justify-between">

        {/* LEFT SIDE */}
        <div className="flex items-center gap-5 sm:gap-7 h-full">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-[32px] h-[32px] rounded-[8px] bg-[#567245] flex items-center justify-center text-white shadow-sm">
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
            </div>
            <span className="font-bold text-[19px] text-[#f5f5f5] tracking-tight">
              ZERTEX
            </span>
          </Link>

          <div className="hidden lg:block w-[1px] h-5 bg-[#2a3420]"></div>

          {/* NAV LINKS */}
          <nav className="hidden lg:flex items-center gap-7 h-full">
            <NavLinkItem to="/">Home</NavLinkItem>
            <NavLinkItem to="/products">Store</NavLinkItem>
            
            {/* <NavLinkItem to="/categories">Categories</NavLinkItem> */}
      
            <NavLinkItem to="/">Orders</NavLinkItem>
            
          </nav>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-5 sm:gap-6">

          {/* CART */}
          <Link to="/cart" className="relative text-[#889679] hover:text-white transition-colors">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>

            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#567245] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {itemCount}
              </span>
            )}
          </Link>

          {/* PROFILE */}
          {isAuthenticated ? (
            <div className="relative">

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileOpen(!profileOpen);
                }}
                className="flex items-center gap-2 text-[#c4d6a1] hover:text-white transition-colors"
              >
                <img
                  src={user?.avatar || userDefaultAvatar}
                  alt="user avatar"
                  className="w-[32px] h-[32px] rounded-[8px] object-cover border border-[#2a3420]"
                  onError={(e) => { e.target.src = userDefaultAvatar; }}
                />

                <span className="text-[14px] font-medium hidden sm:block">
                  {user?.name?.split(' ')[0]}
                </span>

                <svg className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* DROPDOWN */}
              <div
                className={`absolute right-0 mt-3 w-[180px] bg-[#1e2517] border border-[#2a3420] rounded-[10px] shadow-xl overflow-hidden z-50 transform transition-all duration-200 origin-top-right
                ${
                  profileOpen
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                }`}
              >
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="block px-4 py-3 text-sm text-[#c4d6a1] hover:bg-[#2a3420]"
                >
                  Profile
                </Link>

                <Link
                  to="/"
                  onClick={() => setProfileOpen(false)}
                  className="block px-4 py-3 text-sm text-[#889679] hover:bg-[#2a3420]"
                >
                  My Orders
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setProfileOpen(false);
                    navigate('/');
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-[#2a3420]"
                >
                  Log Out
                </button>
              </div>

            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 bg-[#567245] hover:bg-[#658553] text-[#f5f5f5] px-4 py-2 rounded-[8px] text-[14px] font-semibold"
            >
              Sign In
            </Link>
          )}

          {/* MOBILE MENU BUTTON */}
          <button
            className="lg:hidden text-[#889679] hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="lg:hidden bg-[#1e2517] border-t border-[#2a3420] px-4 py-4 space-y-2">

          <Link to="/" onClick={()=>setMenuOpen(false)} className="block text-white py-3 px-4">Home</Link>
          <Link to="/products" onClick={()=>setMenuOpen(false)} className="block text-[#889679] py-3 px-4">Store</Link>
          <Link to="/categories" onClick={()=>setMenuOpen(false)} className="block text-[#889679] py-3 px-4">Categories</Link>
          <Link to="/orders" onClick={()=>setMenuOpen(false)} className="block text-[#889679] py-3 px-4">Orders</Link>
          <Link to="/profile" onClick={()=>setMenuOpen(false)} className="block text-[#889679] py-3 px-4">Profile</Link>
          <Link to="/cart" onClick={()=>setMenuOpen(false)} className="block text-[#889679] py-3 px-4">Cart</Link>

          {!isAuthenticated && (
            <Link to="/login" className="block bg-[#567245] text-white py-3 px-4 rounded-[8px] text-center">
              Sign In
            </Link>
          )}

        </div>
      )}
    </header>
  );
}