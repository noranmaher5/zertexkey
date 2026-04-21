import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI, authAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import userDefaultAvatar from '../assets/user.png';

const getEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
};

const API_ORIGIN =
  process.env.REACT_APP_API_ORIGIN ||
  process.env.REACT_APP_BACKEND_ORIGIN ||
  'https://zertexkey-production.up.railway.app';

const StarRating = ({ value = 0, size = 14, color = '#fbbf24' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} style={{ fontSize: size, lineHeight: 1, color: star <= Math.round(value) ? color : 'rgba(255,255,255,0.18)' }}>★</span>
    ))}
  </div>
);

const TrashIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const categoryLabels = {
  'roblox': 'Roblox', 'minecraft': 'Minecraft', 'steam': 'Steam',
  'discord': 'Discord', 'chatgpt': 'ChatGPT', 'movies': 'Streaming',
  'gift-cards': 'Gift Card', 'ebooks': 'eBook', 'games': 'Games', 'general': 'General'
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');
  .pd-root { background: #182512; min-height: 100vh; font-family: 'Outfit', sans-serif; color: #e8f0e0; }
  .pd-glass { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; }
  .pd-page-shell { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
  .pd-main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; }
  .pd-badge { display: inline-flex; align-items: center; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .pd-btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #22c55e; color: #fff; border: none; border-radius: 12px; padding: 13px 28px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all .2s; text-decoration: none; }
  .pd-btn-primary:hover { background: #16a34a; transform: translateY(-1px); }
  .pd-qty-btn { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: rgba(255,255,255,0.5); font-size: 20px; cursor: pointer; }
  .pd-thumb-btn { flex-shrink: 0; width: 64px; height: 64px; border-radius: 10px; overflow: hidden; border: 2px solid transparent; cursor: pointer; background: none; padding: 0; }
  .pd-thumb-btn.active { border-color: #22c55e; }
  .pd-review-item { display: flex; gap: 14px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 14px; border: 1px solid rgba(255,255,255,0.05); position: relative; }
  .pd-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #15803d); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; }

  .pd-review-dots-btn {
    background: none; border: none; cursor: pointer; padding: 4px 6px;
    border-radius: 6px; display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.25); transition: all 0.2s;
  }
  .pd-review-dots-btn:hover { background: rgba(248,113,113,0.1); color: #f87171; }

  .pd-review-menu {
    position: absolute; right: 12px; top: 38px;
    background: #111; border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; z-index: 50; overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.6); min-width: 150px;
  }
  .pd-review-menu-item {
    width: 100%; padding: 10px 14px; border: none; background: none;
    color: #f87171; font-size: 12px; font-weight: 600; text-align: left;
    cursor: pointer; display: flex; align-items: center; gap: 8px;
    transition: background 0.15s;
  }
  .pd-review-menu-item:hover { background: rgba(248,113,113,0.12); }

  .swal2-popup.pd-swal-custom { border: 1px solid rgba(34,197,94,0.3) !important; border-radius: 24px !important; padding: 20px !important; }
  .pd-info-grid { display: grid; grid-template-columns: 1fr; gap: 15px; text-align: left; }
  .pd-info-video-container { position: relative; width: 100%; padding-top: 56.25%; border-radius: 15px; overflow: hidden; background: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-top: 10px; }
  .pd-info-video-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }

  @media (max-width: 1024px) { .pd-main-grid { gap: 36px; } }
  @media (max-width: 768px) {
    .pd-page-shell { padding: 0 16px; }
    .pd-main-grid { grid-template-columns: 1fr; gap: 24px; }
    .pd-root { padding-top: 72px !important; padding-bottom: 44px !important; }
    .pd-main-title { font-size: 30px !important; margin-top: 10px !important; }
    .pd-price { font-size: 38px !important; }
    .pd-actions-row { flex-direction: column; gap: 12px !important; }
    .pd-qty-box, .pd-btn-primary, .pd-wishlist-btn { width: 100%; }
    .pd-qty-box { justify-content: center; }
    .pd-review-shell { margin-top: 36px !important; padding: 22px 18px !important; }
    .pd-review-header { font-size: 22px !important; margin-bottom: 20px !important; }
  }
  @media (max-width: 480px) {
    .pd-page-shell { padding: 0 12px; }
    .pd-root { padding-top: 66px !important; }
    .pd-main-image { aspect-ratio: 1 / 1; border-radius: 18px !important; }
    .pd-thumb-btn { width: 54px; height: 54px; }
    .pd-price { font-size: 32px !important; }
    .pd-review-item { padding: 14px; }
  }
`;

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [activeMenu, setActiveMenu] = useState(null);

  const isAdmin = user && ['admin', 'owner', 'hidden', 'manager', 'editor'].includes(user.role);

  useEffect(() => {
    productAPI.getOne(id)
      .then(res => { setProduct(res.data.product); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    const loadWishlistState = async () => {
      if (!isAuthenticated || !product?._id) { setInWishlist(false); return; }
      try {
        const res = await authAPI.getWishlist();
        setInWishlist((res.data.wishlist || []).some(item => item._id === product._id));
      } catch { setInWishlist(false); }
    };
    loadWishlistState();
  }, [isAuthenticated, product?._id]);

  const getImageUrl = (img) => {
    if (!img) return `https://placehold.co/600x600/182512/22c55e?text=No+Image`;
    if (img.startsWith('http')) return img;
    return `${API_ORIGIN}${img}`;
  };

const handleAddToCart = async () => {
  if (!product) return;

  if (!product.isUnlimited && !product.availableStock) {
    toast.error('Product is out of stock', { id: 'cart-status' });
    return;
  }

  await addItem(product, quantity);
};

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) return toast.error('Please log in to use wishlist');
    if (!product?._id) return;
    setWishlistLoading(true);
    try {
      const res = await authAPI.toggleWishlist(product._id);
      setInWishlist(res.data.inWishlist);
      toast.success(res.data.inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Wishlist update failed');
    } finally { setWishlistLoading(false); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error('Please log in to leave a review');
    setSubmitting(true);
    try {
      await productAPI.addReview(product._id, review);
      toast.success('Review submitted!');
      const res = await productAPI.getOne(id);
      setProduct(res.data.product);
      setReview({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await productAPI.deleteReview(product._id, reviewId);
      toast.success('Review deleted');
      setProduct(prev => ({ ...prev, reviews: prev.reviews.filter(r => r._id !== reviewId) }));
      setActiveMenu(null);
    } catch { toast.error('Failed to delete review'); }
  };

  const handleInfoClick = () => {
    if (!product) return;
    const currentImageUrl = getImageUrl(images[activeImg]);
    const embedUrl = getEmbedUrl(product.youtubeUrl);
    Swal.fire({
      title: `<span style="font-family:'Rajdhani'; font-weight:800; color:#e8f0e0;">Product Details</span>`,
      background: '#14210f', showCloseButton: true, showConfirmButton: false,
      width: '700px', customClass: { popup: 'pd-swal-custom' },
      html: `
        <div class="pd-info-grid">
          <div style="display:flex;gap:20px;align-items:start;">
            <img src="${currentImageUrl}" style="width:150px;height:150px;object-fit:cover;border-radius:12px;border:1px solid rgba(34,197,94,0.3);" />
            <div style="flex:1;">
              <h3 style="margin:0 0 8px 0;color:#22c55e;font-family:'Rajdhani';font-size:22px;">${product.name}</h3>
              <div style="margin-bottom:10px;"><span style="background:rgba(34,197,94,0.15);color:#22c55e;padding:3px 10px;border-radius:8px;font-size:11px;font-weight:700;text-transform:uppercase;">${categoryLabels[product.category] || 'Category'}</span></div>
              <p style="color:rgba(232,240,224,0.7);font-size:14px;line-height:1.5;margin:0;">${product.description}</p>
            </div>
          </div>
          ${product.extraInfo ? `<div style="background:rgba(34,197,94,0.05);padding:15px;border-radius:12px;border-left:4px solid #22c55e;"><p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6);font-style:italic;">"${product.extraInfo}"</p></div>` : ''}
          ${embedUrl ? `<div style="margin-top:15px;border-top:1px solid rgba(255,255,255,0.1);padding-top:15px;"><h4 style="margin:0 0 12px 0;font-size:16px;color:#e8f0e0;font-family:'Rajdhani';letter-spacing:1px;">VIDEO PREVIEW</h4><div class="pd-info-video-container"><iframe src="${embedUrl}?autoplay=1&mute=1" allow="autoplay; encrypted-media" allowfullscreen></iframe></div></div>` : ''}
        </div>`
    });
  };

  if (loading) return <div className="pd-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!product) return <div className="pd-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Product not found</div>;

  const images = [product.image, ...(product.images || [])].filter(Boolean);

  return (
    <div className="pd-root" style={{ paddingTop: 80, paddingBottom: 64 }}>
      <style>{STYLES}</style>
      <div className="pd-page-shell">
        <nav style={{ display: 'flex', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link to="/products" style={{ color: 'inherit', textDecoration: 'none' }}>Shop</Link>
          <span>/</span>
          <span style={{ color: '#22c55e' }}>{product.name}</span>
        </nav>

        <div className="pd-main-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div className="pd-glass pd-main-image" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1', borderRadius: 24 }}>
              <img src={getImageUrl(images[activeImg])} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={product.name} />
              <button onClick={handleInfoClick} title="View Video & Info" style={{ position: 'absolute', top: 15, right: 15, width: 42, height: 42, borderRadius: '50%', background: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>i</button>
            </div>
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 5 }}>
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`pd-thumb-btn ${activeImg === i ? 'active' : ''}`}>
                  <img src={getImageUrl(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 25 }}>
            <div>
              <span className="pd-badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>
                {categoryLabels[product.category] || product.category}
              </span>
              <h1 className="pd-main-title" style={{ fontSize: 42, fontWeight: 800, color: '#e8f0e0', marginTop: 15, fontFamily: 'Rajdhani' }}>{product.name}</h1>
            </div>

            <div className="pd-glass" style={{ padding: '25px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 15 }}>
                <span className="pd-price" style={{ fontSize: 48, fontWeight: 800, color: '#22c55e' }}>${product.price.toFixed(2)}</span>
                {product.originalPrice > product.price && (
                  <span className="pd-strike-price" style={{ fontSize: 22, color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through' }}>${product.originalPrice.toFixed(2)}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: (product.availableStock > 0 || product.isUnlimited) ? '#22c55e' : '#ff4444' }}></div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                  {product.isUnlimited ? '∞ Unlimited Stock' : product.availableStock > 0 ? `${product.availableStock} Units in Stock` : 'Out of Stock'}
                </span>
              </div>
            </div>

            <div className="pd-actions-row" style={{ display: 'flex', gap: 15 }}>
              <div className="pd-glass pd-qty-box" style={{ display: 'flex', alignItems: 'center', borderRadius: 15 }}>
                <button className="pd-qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span style={{ width: 40, textAlign: 'center', fontWeight: 'bold' }}>{quantity}</span>
                <button className="pd-qty-btn" onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              <button onClick={handleAddToCart} className="pd-btn-primary" style={{ flex: 1 }} disabled={!product.isUnlimited && !product.availableStock}>
                {(!product.isUnlimited && !product.availableStock) ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>

            <button onClick={handleToggleWishlist} disabled={wishlistLoading} className="pd-glass pd-wishlist-btn" style={{ padding: '14px 18px', borderRadius: 15, border: `1px solid ${inWishlist ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.08)'}`, background: inWishlist ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)', color: inWishlist ? '#f87171' : '#e8f0e0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 700, cursor: wishlistLoading ? 'not-allowed' : 'pointer' }}>
              <span>{wishlistLoading ? '...' : (inWishlist ? '♥' : '♡')}</span>
              {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>

            <div>
              <h3 style={{ fontSize: 18, color: '#e8f0e0', marginBottom: 10, fontFamily: 'Rajdhani' }}>About this product</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, fontSize: 15 }}>{product.description}</p>
            </div>
          </div>
        </div>

        <div className="pd-glass pd-review-shell" style={{ marginTop: 60, padding: 40 }}>
          <h2 className="pd-review-header" style={{ fontSize: 28, fontFamily: 'Rajdhani', marginBottom: 30 }}>Product Reviews</h2>
          {isAuthenticated ? (
            <form onSubmit={handleReview} style={{ marginBottom: 40, display: 'grid', gap: 15 }}>
              <div>
                <p style={{ margin: '0 0 8px 0', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Your rating</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setReview({ ...review, rating: star })} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', fontSize: 28, color: star <= review.rating ? '#fbbf24' : 'rgba(255,255,255,0.2)' }}>★</button>
                  ))}
                </div>
              </div>
              <textarea className="pd-input" rows="3" placeholder="Share your thoughts..." style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', color: '#fff' }} value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} />
              <button type="submit" className="pd-btn-primary" style={{ width: 'fit-content' }}>{submitting ? 'Sending...' : 'Submit Review'}</button>
            </form>
          ) : (
            <p style={{ color: 'rgba(255,255,255,0.3)', marginBottom: 30 }}>Sign in to write a review.</p>
          )}

          <div style={{ display: 'grid', gap: 15 }}>
            {product.reviews?.length > 0 ? product.reviews.map((r, i) => (
              <div key={r._id || i} className="pd-review-item">
                <img src={r.user?.avatar || userDefaultAvatar} alt="User" className="pd-avatar" style={{ objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <h4 style={{ margin: 0, fontSize: 15, color: '#22c55e' }}>{r.user?.name || r.name || 'Customer'}</h4>
                      <StarRating value={r.rating} size={11} />
                    </div>

                    {isAdmin && (
                      <div style={{ position: 'relative' }}>
                        <button
                          className="pd-review-dots-btn"
                          onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === r._id ? null : r._id); }}
                          title="Review options"
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
                          </svg>
                        </button>
                        {activeMenu === r._id && (
                          <div className="pd-review-menu">
                            <button
                              onClick={() => handleDeleteReview(r._id)}
                              className="pd-review-menu-item"
                            >
                              <TrashIcon />
                              Delete Review
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p style={{ margin: '5px 0 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{r.comment}</p>
                </div>
              </div>
            )) : <p style={{ color: 'rgba(255,255,255,0.2)' }}>No reviews yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}