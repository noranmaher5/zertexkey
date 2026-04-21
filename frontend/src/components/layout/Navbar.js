import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import userDefaultAvatar from '../../assets/user.png';
import NotificationBell from '../common/NotificationBell';

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
  const wishlistCount = user?.wishlist?.length || 0;

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
              ZetrexKeys
            </span>
          </Link>

          <div className="hidden lg:block w-[1px] h-5 bg-[#2a3420]"></div>

          {/* NAV LINKS */}
          <nav className="hidden lg:flex items-center gap-7 h-full">
            <NavLinkItem to="/">Home</NavLinkItem>
            <NavLinkItem to="/products">Store</NavLinkItem>
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

         

       
          {isAuthenticated && <NotificationBell />}

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
                ${profileOpen
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                }`}
              >
                <Link to="/profile" onClick={() => setProfileOpen(false)} className="block px-4 py-3 text-sm text-[#c4d6a1] hover:bg-[#2a3420]">Profile</Link>
                <Link to="/orders" onClick={() => setProfileOpen(false)} className="block px-4 py-3 text-sm text-[#889679] hover:bg-[#2a3420]">My Orders</Link>
                <button
                  onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
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
          <button className="lg:hidden text-[#889679] hover:text-white p-1" onClick={() => setMenuOpen(true)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

        </div>
      </div>

      {/* OVERLAY */}
      <div
        onClick={() => setMenuOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* SLIDE-IN DRAWER */}
      <div
        className="lg:hidden"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: 270, zIndex: 70,
          background: '#111a0d',
          borderLeft: '1px solid #2a3420',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #2a3420' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:'#567245', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg style={{ width:14, height:14, marginLeft:1 }} fill="white" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
            </div>
            <span style={{ fontWeight:700, fontSize:16, color:'#f5f5f5' }}>ZetrexKeys</span>
          </div>
          <button onClick={() => setMenuOpen(false)} style={{ color:'#889679', background:'none', border:'none', cursor:'pointer', padding:4 }}>
            <svg style={{ width:20, height:20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info */}
        {isAuthenticated && (
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 20px', borderBottom:'1px solid #2a3420', background:'#0d1409' }}>
            <img
              src={user?.avatar || userDefaultAvatar}
              alt="avatar"
              style={{ width:42, height:42, borderRadius:8, objectFit:'cover', border:'1px solid #2a3420', flexShrink:0 }}
              onError={e => { e.target.src = userDefaultAvatar; }}
            />
            <div style={{ minWidth:0 }}>
              <p style={{ fontSize:14, fontWeight:600, color:'#e8f0e0', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</p>
              <p style={{ fontSize:11, color:'#4a5a3a', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</p>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav style={{ flex:1, overflowY:'auto', padding:'10px 12px' }}>
          {[
            { to:'/', label:'Home', d:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
            { to:'/products', label:'Store', d:'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
            { to:'/cart', label:'Cart', badge: itemCount, d:'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
            { to:'/wishlist', label:'Wishlist', badge: wishlistCount, d:'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 10-6.364-6.364L12 6.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
            ...(isAuthenticated ? [
              { to:'/orders', label:'My Orders', d:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { to:'/profile', label:'Profile', d:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
            ] : []),
          ].map(({ to, label, d, badge }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', borderRadius:10, marginBottom:2, textDecoration:'none', color:'#889679', transition:'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.background='#1e2a17'; e.currentTarget.style.color='#e8f0e0'; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#889679'; }}
            >
              <svg style={{ width:18, height:18, flexShrink:0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
              </svg>
              <span style={{ fontSize:14, fontWeight:500, flex:1 }}>{label}</span>
              {badge > 0 && (
                <span style={{ background:'#567245', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:20 }}>{badge}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding:'12px', borderTop:'1px solid #2a3420' }}>
          {isAuthenticated ? (
            <button
              onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'12px', borderRadius:10, background:'none', border:'none', cursor:'pointer', color:'#f87171', transition:'background 0.18s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(248,113,113,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background='none'}
            >
              <svg style={{ width:18, height:18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span style={{ fontSize:14, fontWeight:500 }}>Log Out</span>
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'#567245', color:'#fff', padding:'13px', borderRadius:10, textDecoration:'none', fontSize:14, fontWeight:600 }}
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}