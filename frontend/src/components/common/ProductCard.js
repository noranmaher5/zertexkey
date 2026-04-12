import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const CATEGORY_COLORS = {
  minecraft:    { text: '#5a9e38', bg: 'rgba(90,158,56,0.12)',  border: 'rgba(90,158,56,0.25)'  },
  steam:        { text: '#66c0f4', bg: 'rgba(102,192,244,0.12)', border: 'rgba(102,192,244,0.25)' },
  discord:      { text: '#7289da', bg: 'rgba(114,137,218,0.12)', border: 'rgba(114,137,218,0.25)' },
  chatgpt:      { text: '#10a37f', bg: 'rgba(16,163,127,0.12)', border: 'rgba(16,163,127,0.25)'  },
  movies:       { text: '#e50914', bg: 'rgba(229,9,20,0.12)',   border: 'rgba(229,9,20,0.25)'    },
  'gift-cards': { text: '#f5c518', bg: 'rgba(245,197,24,0.12)', border: 'rgba(245,197,24,0.25)'  },
  ebooks:       { text: '#ff9800', bg: 'rgba(255,152,0,0.12)',  border: 'rgba(255,152,0,0.25)'   },
  games:        { text: '#b44fff', bg: 'rgba(180,79,255,0.12)', border: 'rgba(180,79,255,0.25)'  },
};

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [hovered, setHovered] = useState(false);

  const discount = product.discountPercentage ||
    (product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0);

  const cat   = product.category?.toLowerCase() || '';
  const color = CATEGORY_COLORS[cat] || { text: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' };
  const label = product.platform || product.category || '';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#111f12',
        borderRadius: 16,
        overflow: 'hidden',
        border: `1px solid ${hovered ? 'rgba(34,197,94,0.45)' : 'rgba(34,197,94,0.12)'}`,
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 16px 40px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.25)',
        cursor: 'pointer',
      }}
    >
      {/* ── Image ── */}
      <Link
        to={`/products/${product._id}`}
        style={{ display: 'block', position: 'relative', height: 160, flexShrink: 0, overflow: 'hidden', background: '#0d1f0e' }}
      >
        <img
          src={product.image || `https://placehold.co/400x300/0d1f0e/22c55e?text=${encodeURIComponent(product.name)}`}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
          onError={e => { e.target.src = `https://placehold.co/400x300/0d1f0e/22c55e?text=${encodeURIComponent(product.name?.[0] || '?')}`; }}
        />

        {/* Discount badge */}
        {discount > 0 && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: '#ef4444', color: '#fff',
            fontSize: 11, fontWeight: 800,
            padding: '3px 9px', borderRadius: 6,
          }}>
            -{discount}%
          </div>
        )}

        {/* Region badge */}
        {product.region && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(10,21,11,0.78)',
            color: 'rgba(240,253,244,0.75)',
            fontSize: 11, fontWeight: 600,
            padding: '3px 9px', borderRadius: 6,
            border: '1px solid rgba(34,197,94,0.18)',
          }}>
            {product.region}
          </div>
        )}
      </Link>

      {/* ── Content ── */}
      <div style={{ padding: '13px 15px 15px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Category pill */}
        {label && (
          <span style={{
            display: 'inline-block',
            fontSize: 11, fontWeight: 700,
            color: color.text,
            background: color.bg,
            border: `1px solid ${color.border}`,
            padding: '2px 9px', borderRadius: 5,
            alignSelf: 'flex-start',
            fontFamily: 'Outfit, sans-serif',
          }}>
            {label}
          </span>
        )}

        {/* Title */}
        <h3 style={{
          fontSize: 13.5,
          fontWeight: 700,
          color: '#f0fdf4',
          lineHeight: 1.4,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontFamily: 'Outfit, sans-serif',
        }}>
          {product.name}
        </h3>

        {/* Price + Button */}
        <div style={{ marginTop: 'auto', paddingTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e', fontFamily: 'Outfit, sans-serif' }}>
              ${product.price.toFixed(2)}
            </div>
            {product.originalPrice > product.price && (
              <div style={{ fontSize: 11, color: '#4a5e4a', textDecoration: 'line-through' }}>
                ${product.originalPrice.toFixed(2)}
              </div>
            )}
          </div>

          <button
            onClick={e => { e.preventDefault(); addItem(product); }}
            disabled={product.stock === 0}
            style={{
              padding: '8px 16px',
              borderRadius: 10,
              background: hovered ? '#22c55e' : 'rgba(34,197,94,0.12)',
              border: `1px solid ${hovered ? '#22c55e' : 'rgba(34,197,94,0.3)'}`,
              color: hovered ? '#0a150b' : '#22c55e',
              fontSize: 12, fontWeight: 700,
              fontFamily: 'Outfit, sans-serif',
              cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              opacity: product.stock === 0 ? 0.4 : 1,
            }}
          >
            {product.stock === 0 ? 'Out' : 'Add +'}
          </button>
        </div>
      </div>
    </div>
  );
}