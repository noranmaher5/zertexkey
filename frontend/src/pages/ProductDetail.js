import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const categoryLabels = {
  'game-codes': 'Game Code', 'gift-cards': 'Gift Card',
  'ebooks': 'eBook', 'software': 'Software',
  'subscriptions': 'Subscription', 'other': 'Other',
};

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Rajdhani:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');

  .pd-root {
    background: #182512;
    min-height: 100vh;
    font-family: 'Outfit', sans-serif;
    color: #e8f0e0;
  }
  .pd-glass {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px;
  }
  .pd-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .04em;
    font-family: 'Outfit', sans-serif;
  }
  .pd-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #22c55e;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 13px 28px;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: all .2s;
    text-decoration: none;
  }
  .pd-btn-primary:hover { background: #16a34a; transform: translateY(-1px); }
  .pd-btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(255,255,255,0.06);
    color: #e8f0e0;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 13px 24px;
    font-size: 15px;
    font-weight: 700;
    font-family: 'Outfit', sans-serif;
    cursor: pointer;
    transition: all .2s;
    text-decoration: none;
  }
  .pd-btn-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.22); }
  .pd-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 12px 16px;
    color: #e8f0e0;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    outline: none;
    transition: border-color .2s;
    resize: none;
  }
  .pd-input:focus { border-color: rgba(34,197,94,0.5); }
  .pd-input::placeholder { color: rgba(255,255,255,0.3); }
  .pd-qty-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.5);
    font-size: 20px;
    cursor: pointer;
    transition: color .2s;
  }
  .pd-qty-btn:hover { color: #e8f0e0; }
  .pd-star-btn {
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color .2s;
  }
  .pd-thumb-btn {
    flex-shrink: 0;
    width: 64px;
    height: 64px;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid transparent;
    transition: border-color .2s;
    cursor: pointer;
    background: none;
    padding: 0;
  }
  .pd-thumb-btn.active { border-color: #22c55e; }
  .pd-thumb-btn:not(.active) { border-color: rgba(255,255,255,0.1); }
  .pd-thumb-btn:not(.active):hover { border-color: rgba(255,255,255,0.3); }
  .pd-skeleton {
    background: linear-gradient(90deg, #1e2e18 25%, #253520 50%, #1e2e18 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 16px;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .pd-review-item {
    display: flex;
    gap: 14px;
    padding: 16px;
    background: rgba(255,255,255,0.03);
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.05);
  }
  .pd-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #22c55e, #15803d);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    flex-shrink: 0;
    font-family: 'Rajdhani', sans-serif;
  }
`;

export default function ProductDetail() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [review, setReview]     = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeImg, setActiveImg]   = useState(0);

  useEffect(() => {
    productAPI.getOne(id)
      .then(res => { setProduct(res.data.product); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addItem(product);
    toast.success(`${quantity}x ${product.name} added to cart`);
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
    } finally {
      setSubmitting(false);
    }
  };

  // ── NEW: Info popup handler ──────────────────────────────────────────────
  const handleInfoClick = () => {
    if (!product) return;
    const imageUrl =
      images[activeImg] ||
      `https://placehold.co/600x600/182512/22c55e?text=${encodeURIComponent(product.name[0])}`;

    Swal.fire({
      title: product.name,
      background: '#1a2e14',
      color: '#e8f0e0',
      width: 620,
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        popup: 'pd-swal-popup',
        title: 'pd-swal-title',
        closeButton: 'pd-swal-close',
      },
      html: `
        <style>
          .pd-swal-popup  { border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 18px !important; }
          .pd-swal-title  { font-family: 'Rajdhani', sans-serif !important; font-weight: 800 !important; font-size: 26px !important; color: #e8f0e0 !important; text-align: left !important; padding: 0 0 12px 0 !important; border-bottom: 1px solid rgba(255,255,255,0.07); }
          .pd-swal-close  { color: rgba(255,255,255,0.4) !important; font-size: 22px !important; top: 14px !important; right: 14px !important; }
          .pd-swal-close:hover { color: #e8f0e0 !important; }
          .pd-info-img    { width: 100%; max-height: 260px; object-fit: cover; border-radius: 12px; margin: 14px 0 18px; border: 1px solid rgba(255,255,255,0.07); }
          .pd-info-desc   { font-family: 'Outfit', sans-serif; font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.75; text-align: left; margin-bottom: 18px; }
          .pd-info-meta   { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
          .pd-info-badge  { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; font-family: 'Outfit', sans-serif; }
          .pd-info-badge-cat  { background: rgba(34,197,94,0.1);    color: #22c55e;                border: 1px solid rgba(34,197,94,0.25); }
          .pd-info-badge-plat { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.1); }
          .pd-info-badge-reg  { background: rgba(96,165,250,0.1);   color: #93c5fd;                border: 1px solid rgba(96,165,250,0.2); }
          .pd-info-video-wrap { position: relative; width: 100%; padding-top: 56.25%; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.07); }
          .pd-info-video-wrap iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: none; }
        </style>

        <img
          class="pd-info-img"
          src="${imageUrl}"
          alt="${product.name}"
          onerror="this.src='https://placehold.co/600x300/182512/22c55e?text=${encodeURIComponent(product.name[0])}'"
        />

        ${product.description ? `<p class="pd-info-desc">${product.description}</p>` : ''}
        ${product.extraInfo ? `
  <div style="background:rgba(34,197,94,0.06);border:1px solid rgba(34,197,94,0.15);border-radius:12px;padding:14px 16px;margin-bottom:18px;">
    <p style="font-family:'Outfit',sans-serif;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.75;text-align:left;margin:0;">${product.extraInfo}</p>
  </div>
` : ''}

        <div class="pd-info-meta">
          ${product.category ? `<span class="pd-info-badge pd-info-badge-cat">📦 ${categoryLabels[product.category] || product.category}</span>` : ''}
          ${product.platform ? `<span class="pd-info-badge pd-info-badge-plat">🎮 ${product.platform}</span>` : ''}
          ${product.region   ? `<span class="pd-info-badge pd-info-badge-reg">🌍 ${product.region}</span>` : ''}
        </div>

        ${product.youtubeUrl ? `
          <div class="pd-info-video-wrap">
            <iframe
              src="${product.youtubeUrl.replace('watch?v=', 'embed/')}"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        ` : ''}
      `,
    });
  };
  
  // ────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="pd-root" style={{ paddingTop: 80 }}>
      <style>{STYLES}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          <div className="pd-skeleton" style={{ height: 420 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="pd-skeleton" style={{ height: 32, width: '70%' }} />
            <div className="pd-skeleton" style={{ height: 16, width: '45%' }} />
            <div className="pd-skeleton" style={{ height: 90 }} />
            <div className="pd-skeleton" style={{ height: 50, width: '40%' }} />
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="pd-root" style={{ paddingTop: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <style>{STYLES}</style>
      <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
      <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 800, fontSize: 28, color: '#e8f0e0', marginBottom: 8 }}>Product Not Found</h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>This product doesn't exist or has been removed.</p>
      <Link to="/products" className="pd-btn-primary">Browse Products</Link>
    </div>
  );

  const images = [product.image, ...(product.images || [])].filter(Boolean);
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  return (
    <div className="pd-root" style={{ paddingTop: 80, paddingBottom: 64 }}>
      <style>{STYLES}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.35)', padding: '24px 0' }}>
          <Link to="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color .2s' }}
            onMouseEnter={e => e.target.style.color = '#e8f0e0'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}>Home</Link>
          <span>/</span>
          <Link to="/products" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color .2s' }}
            onMouseEnter={e => e.target.style.color = '#e8f0e0'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}>Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`} style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color .2s', textTransform: 'capitalize' }}
            onMouseEnter={e => e.target.style.color = '#e8f0e0'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}>
            {categoryLabels[product.category]}
          </Link>
          <span>/</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
        </nav>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, marginBottom: 56 }}>

          {/* Images */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── MODIFIED: added position:relative + info icon button ── */}
            <div
              className="pd-glass"
              style={{ overflow: 'hidden', aspectRatio: '1', borderRadius: 20, position: 'relative' }}
            >
              <img
                src={images[activeImg] || `https://placehold.co/600x600/182512/22c55e?text=${encodeURIComponent(product.name[0])}`}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.src = `https://placehold.co/600x600/182512/22c55e?text=${encodeURIComponent(product.name[0])}`; }}
              />

              {/* Info icon */}
              <button
                onClick={handleInfoClick}
                title="Product info"
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'rgba(15,30,10,0.72)',
                  backdropFilter: 'blur(8px)',
                  border: '1.5px solid rgba(34,197,94,0.45)',
                  color: '#22c55e',
                  fontSize: 16,
                  fontWeight: 800,
                  fontFamily: "'Rajdhani', sans-serif",
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  zIndex: 10,
                  transition: 'background .2s, border-color .2s, transform .15s',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(34,197,94,0.18)';
                  e.currentTarget.style.borderColor = '#22c55e';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(15,30,10,0.72)';
                  e.currentTarget.style.borderColor = 'rgba(34,197,94,0.45)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                i
              </button>
            </div>
            {/* ────────────────────────────────────────────────────────── */}

            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`pd-thumb-btn ${activeImg === i ? 'active' : ''}`}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Badges */}
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                <span className="pd-badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                  {categoryLabels[product.category]}
                </span>
                {discount > 0 && (
                  <span className="pd-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                    -{discount}% OFF
                  </span>
                )}
                {product.platform && (
                  <span className="pd-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {product.platform}
                  </span>
                )}
                {product.region && (
                  <span className="pd-badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    🌍 {product.region}
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 36, color: '#e8f0e0', lineHeight: 1.1, marginBottom: 12 }}>
                {product.name}
              </h1>

              {/* Rating */}
              {product.rating?.count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex' }}>
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} style={{ width: 16, height: 16, color: s <= Math.round(product.rating.average) ? '#fbbf24' : 'rgba(255,255,255,0.15)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span style={{ color: '#e8f0e0', fontWeight: 600, fontSize: 14 }}>{product.rating.average}</span>
                  <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>({product.rating.count} reviews)</span>
                </div>
              )}
            </div>

            {/* Price Box */}
            <div className="pd-glass" style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 4 }}>
                <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 42, color: '#e8f0e0', lineHeight: 1 }}>
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice > product.price && (
                  <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', marginBottom: 4 }}>
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {discount > 0 && (
                <p style={{ color: '#22c55e', fontSize: 13, marginBottom: 12 }}>
                  You save ${(product.originalPrice - product.price).toFixed(2)}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: product.availableStock > 0 ? '#22c55e' : '#ef4444' }} />
                <span style={{ fontSize: 13, color: product.availableStock > 0 ? '#22c55e' : '#ef4444' }}>
                  {product.availableStock > 0 ? `${product.availableStock} in stock` : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* Quantity + Buttons */}
            {product.availableStock > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="pd-glass" style={{ display: 'flex', alignItems: 'center', borderRadius: 12 }}>
                  <button className="pd-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                  <span style={{ width: 32, textAlign: 'center', color: '#e8f0e0', fontWeight: 700, fontSize: 15 }}>{quantity}</span>
                  <button className="pd-qty-btn" onClick={() => setQuantity(q => Math.min(product.availableStock, q + 1))}>+</button>
                </div>
                <button onClick={handleAddToCart} className="pd-btn-primary" style={{ flex: 1 }}>
                  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart
                </button>
                <Link to="/cart" className="pd-btn-secondary">Buy Now</Link>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#e8f0e0', marginBottom: 8 }}>Description</h3>
              <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, fontSize: 14 }}>{product.description}</p>
            </div>

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {product.tags.map(tag => (
                  <span key={tag} style={{
                    padding: '4px 14px', borderRadius: 20,
                    background: 'rgba(34,197,94,0.07)',
                    border: '1px solid rgba(34,197,94,0.18)',
                    fontSize: 12, color: 'rgba(255,255,255,0.4)',
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="pd-glass" style={{ padding: '32px 36px' }}>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 800, fontSize: 26, color: '#e8f0e0', marginBottom: 24 }}>
            Reviews{' '}
            {product.rating?.count > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontSize: 18 }}>({product.rating.count})</span>
            )}
          </h2>

          {/* Write Review */}
          {isAuthenticated && (
            <form onSubmit={handleReview} style={{ marginBottom: 32, paddingBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, color: '#e8f0e0', fontSize: 15 }}>Write a Review</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Rating:</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1,2,3,4,5].map(s => (
                    <button
                      key={s}
                      type="button"
                      className="pd-star-btn"
                      onClick={() => setReview(r => ({ ...r, rating: s }))}
                      style={{ color: s <= review.rating ? '#fbbf24' : 'rgba(255,255,255,0.2)' }}
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={review.comment}
                onChange={e => setReview(r => ({ ...r, comment: e.target.value }))}
                placeholder="Share your experience..."
                rows={3}
                className="pd-input"
              />
              <div>
                <button type="submit" disabled={submitting} className="pd-btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}

          {/* Review List */}
          {product.reviews?.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>
              No reviews yet. Be the first!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {product.reviews?.map((r, i) => (
                <div key={i} className="pd-review-item">
                  <div className="pd-avatar">
                    {r.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, color: '#e8f0e0', fontSize: 14 }}>{r.user?.name || 'User'}</span>
                      <div style={{ display: 'flex' }}>
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} style={{ width: 12, height: 12, color: s <= r.rating ? '#fbbf24' : 'rgba(255,255,255,0.15)' }} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    {r.comment && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6 }}>{r.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}