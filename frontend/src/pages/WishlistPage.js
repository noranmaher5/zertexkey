import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const API_ORIGIN =
  process.env.REACT_APP_API_ORIGIN ||
  process.env.REACT_APP_BACKEND_ORIGIN ||
  'https://zertexkey-production.up.railway.app';

const getImageUrl = (img) => {
  if (!img) return `https://placehold.co/400x300/0d1f0e/22c55e?text=No+Image`;
  if (img.startsWith('http')) return img;
  return `${API_ORIGIN}${img}`;
};

export default function WishlistPage() {
  const { isAuthenticated, loading } = useAuth();
  const { addItem } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) {
        setPageLoading(false);
        return;
      }
      try {
        const res = await authAPI.getWishlist();
        setWishlist(res.data.wishlist || []);
      } catch {
        toast.error('Failed to load wishlist');
      } finally {
        setPageLoading(false);
      }
    };
    if (!loading) load();
  }, [isAuthenticated, loading]);

  const removeItem = async (productId) => {
    try {
      const res = await authAPI.toggleWishlist(productId);
      setWishlist(res.data.wishlist || []);
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to update wishlist');
    }
  };

  if (loading || pageLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#10140c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#10140c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Wishlist</h1>
        <p style={{ color: '#889679' }}>Please sign in to view your wishlist.</p>
        <Link to="/login" style={{ background: '#567245', color: '#fff', padding: '10px 18px', borderRadius: 10, textDecoration: 'none' }}>Sign In</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#10140c', paddingTop: 96, paddingBottom: 64, color: '#e8f0e0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <p style={{ color: '#4a5a3a', textTransform: 'uppercase', letterSpacing: '.14em', fontSize: 12, fontWeight: 700, margin: 0 }}>Saved products</p>
          <h1 style={{ fontSize: 38, margin: '8px 0 0', fontWeight: 800 }}>My Wishlist</h1>
        </div>

        {wishlist.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', border: '1px solid #1e2517', borderRadius: 18, background: '#111f12' }}>
            <h2 style={{ margin: '0 0 8px' }}>No items saved yet</h2>
            <p style={{ margin: 0, color: '#6b7c5a' }}>Tap the heart on any product to save it here.</p>
            <Link to="/products" style={{ display: 'inline-block', marginTop: 18, background: '#567245', color: '#fff', textDecoration: 'none', padding: '10px 18px', borderRadius: 10 }}>Browse Products</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
            {wishlist.map((product) => (
              <div key={product._id} style={{ background: '#111f12', border: '1px solid #1e2517', borderRadius: 16, overflow: 'hidden' }}>
                <Link to={`/products/${product._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <img src={getImageUrl(product.image)} alt={product.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                  <div style={{ padding: 14 }}>
                    <div style={{ color: '#889679', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em' }}>{product.category}</div>
                    <h3 style={{ margin: '8px 0', fontSize: 15 }}>{product.name}</h3>
                    <div style={{ color: '#22c55e', fontWeight: 800 }}>${Number(product.price || 0).toFixed(2)}</div>
                  </div>
                </Link>
                <div style={{ padding: '0 14px 14px' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => { addItem(product); toast.success('Added to cart'); }}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid rgba(34,197,94,0.25)',
                        background: 'rgba(34,197,94,0.1)',
                        color: '#22c55e',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Add to Cart
                    </button>
                    <button onClick={() => removeItem(product._id)} style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontWeight: 700, cursor: 'pointer' }}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
