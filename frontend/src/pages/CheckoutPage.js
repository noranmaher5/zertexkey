import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { paymentAPI } from '../services/api';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/imageUrl';

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');

  .co-root {
    min-height: 100vh;
    background: #10140c;
    padding-top: 80px;
    padding-bottom: 64px;
    font-family: 'Outfit', sans-serif;
    color: #e8f0e0;
  }
  .co-glass {
    background: rgba(255,255,255,0.03);
    border: 1px solid #2a3420;
    border-radius: 18px;
  }
  .co-input {
    width: 100%;
    background: #1a1f14;
    border: 1px solid #2a3420;
    border-radius: 10px;
    padding: 12px 14px;
    color: #e8f0e0;
    font-size: 14px;
    font-family: 'Outfit', sans-serif;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    box-sizing: border-box;
  }
  .co-input::placeholder { color: #3a4a2a; }
  .co-input:focus {
    border-color: #567245;
    box-shadow: 0 0 0 3px rgba(86,114,69,0.1);
  }
  .co-input:disabled { opacity: .4; cursor: not-allowed; }

  .method-card {
    border: 2px solid #2a3420;
    border-radius: 14px;
    padding: 16px 20px;
    cursor: pointer;
    transition: all .2s;
    background: #161b11;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .method-card:hover:not(.method-card-disabled) { border-color: #567245; background: #1a2014; }
  .method-card.selected {
    border-color: #567245;
    background: rgba(86,114,69,0.08);
    box-shadow: 0 0 0 1px #567245;
  }
  .method-card-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    position: relative;
    overflow: hidden;
    filter: grayscale(0.3);
  }
  .method-card-disabled:hover {
    border-color: #2a3420;
    background: #161b11;
  }
  .coming-soon-badge {
    position: absolute;
    top: 14px;
    right: -32px;
    background: linear-gradient(135deg, #635bff, #7c6fff);
    color: white;
    font-size: 9px;
    font-weight: 800;
    padding: 4px 40px;
    transform: rotate(32deg);
    letter-spacing: .1em;
    font-family: 'Rajdhani', sans-serif;
    z-index: 2;
    box-shadow: 0 2px 12px rgba(99,91,255,0.35);
    text-transform: uppercase;
  }
  .method-radio {
    width: 18px; height: 18px;
    border-radius: 50%;
    border: 2px solid #3a4a2a;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: border-color .2s;
  }
  .method-card.selected .method-radio {
    border-color: #567245;
  }
  .method-radio-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #567245;
    opacity: 0;
    transition: opacity .2s;
  }
  .method-card.selected .method-radio-dot { opacity: 1; }

  .pay-btn {
    width: 100%;
    padding: 15px;
    border-radius: 12px;
    border: none;
    font-family: 'Outfit', sans-serif;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all .2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .pay-btn-stripe {
    background: linear-gradient(135deg, #635bff, #7c6fff);
    color: white;
  }
  .pay-btn-stripe:hover:not(:disabled) {
    background: linear-gradient(135deg, #7c75ff, #9489ff);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(99,91,255,0.3);
  }
  .pay-btn:disabled { opacity: .5; cursor: not-allowed; transform: none !important; }

  .card-input-group {
    background: #1a1f14;
    border: 1px solid #2a3420;
    border-radius: 10px;
    overflow: hidden;
    transition: border-color .2s, box-shadow .2s;
  }
  .card-input-group:focus-within {
    border-color: #567245;
    box-shadow: 0 0 0 3px rgba(86,114,69,0.1);
  }
  .card-field {
    background: transparent;
    border: none;
    color: #e8f0e0;
    font-family: 'Outfit', sans-serif;
    font-size: 14px;
    outline: none;
    padding: 12px 14px;
    width: 100%;
    box-sizing: border-box;
  }
  .card-field::placeholder { color: #3a4a2a; }
  .card-divider { height: 1px; background: #2a3420; }
  .card-row { display: flex; }
  .card-row .card-field { flex: 1; }
  .card-row-divider { width: 1px; background: #2a3420; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin .7s linear infinite; }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .fade-up { animation: fadeUp .35s ease both; }

  .step-badge {
    width: 24px; height: 24px;
    border-radius: 50%;
    background: #567245;
    color: white;
    font-size: 11px;
    font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .security-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #4a5a3a;
  }

  .paypal-wrapper {
    background: rgba(0,48,135,0.05);
    border: 1px solid rgba(0,156,222,0.15);
    border-radius: 14px;
    padding: 20px;
  }
  .paypal-wrapper .paypal-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .paypal-badges {
    display: flex;
    gap: 16px;
    font-size: 11px;
    color: #3a5a7a;
    flex-wrap: wrap;
    justify-content: center;
  }

  .co-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 28px;
    align-items: start;
  }
  .co-summary {
    position: sticky;
    top: 96px;
  }
  @media (max-width: 768px) {
    .co-root {
      padding-top: 70px !important;
      padding-bottom: 40px !important;
    }
    .co-layout {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    .co-summary {
      position: static;
      order: -1;
    }
    .co-glass {
      padding: 18px 16px !important;
    }
    .method-card {
      padding: 14px 16px;
    }
    .coming-soon-badge {
      right: -28px;
      font-size: 8px;
      padding: 3px 36px;
    }
    .security-badge {
      font-size: 10px;
    }
  }
  @media (max-width: 480px) {
    .co-root {
      padding-top: 64px !important;
    }
    .pay-btn {
      font-size: 14px;
      padding: 13px;
    }
    .card-row {
      flex-direction: column;
    }
    .card-row-divider {
      width: 100%;
      height: 1px;
    }
  }
`;

const discountAPI = {
  validate: (data) => API.post('/discounts/validate', data),
};

// ── PayPal Form ───────────────────────────────────────────────────────────────
function PayPalForm({ finalTotal, items, discountData, discountCode, onSuccess, onError }) {
  return (
    <div className="fade-up">
      <div className="paypal-wrapper">
        <div className="paypal-info">
          <svg width="100" height="26" viewBox="0 0 100 26" fill="none">
            <text x="0" y="20" fontFamily="Arial" fontWeight="800" fontSize="22" fill="#003087">Pay</text>
            <text x="36" y="20" fontFamily="Arial" fontWeight="800" fontSize="22" fill="#009cde">Pal</text>
          </svg>
          <p style={{ fontSize: 13, color: '#4a6a8a', textAlign: 'center', margin: 0 }}>
            Sign in to your PayPal account to complete your payment securely
          </p>
          <div className="paypal-badges">
            <span>🔒 Buyer Protection</span>
            <span>⚡ Instant Transfer</span>
            <span>🌍 Global</span>
          </div>
        </div>

        <PayPalButtons
  style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 45 }}

  
  createOrder={async () => {
    const res = await API.post('/payments/paypal/create', {
      amount: finalTotal,
    });
    return res.data.paypalOrderId;
  }}

 
  onApprove={async (data) => {
    const res = await API.post('/payments/paypal/capture', {
      paypalOrderId: data.orderID,
      items: items.map(i => ({
        productId: i.product?.toString() || i.productId,
        quantity: i.quantity,
      })),
      discountCode: discountData ? discountCode : undefined,
    });
    onSuccess(res.data.orderId);
  }}

  onError={(err) => {
    console.error('PayPal error:', err);
    onError('PayPal payment failed. Please try again.');
  }}

  onCancel={() => {
    toast('Payment cancelled.');
  }}
/>
      </div>
    </div>
  );
}

// ── Main Checkout Page ────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, total, clearCart, isEmpty } = useCart();
  const navigate = useNavigate();

  const [method, setMethod] = useState('paypal');
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState('');

  // Discount
  const [discountCode, setDiscountCode] = useState('');
  const [discountData, setDiscountData] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return toast.error('Please enter a discount code');
    setDiscountLoading(true);
    try {
      const res = await discountAPI.validate({ code: discountCode, totalAmount: total });
      setDiscountData(res.data);
      toast.success(`✅ Code applied! You save $${res.data.discountAmount.toFixed(2)}`);
    } catch (err) {
      setDiscountData(null);
      toast.error(err.response?.data?.message || 'Invalid discount code');
    } finally {
      setDiscountLoading(false);
    }
  };

  const finalTotal = discountData ? discountData.finalAmount : total;

  useEffect(() => {
    if (isEmpty) {
      navigate('/cart');
      return;
    }
    setInitLoading(false);
  }, [isEmpty, navigate]);

  const handlePayPalSuccess = (orderId) => {
    clearCart();
    toast.success('🎉 Payment successful! Your order is confirmed.');
    navigate(`/orders/${orderId}`);
  };

  const handlePayPalError = (msg) => {
    toast.error(msg);
  };

  if (initLoading) return (
    <div style={{ minHeight:'100vh', background:'#10140c', display:'flex',
      alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <style>{STYLES}</style>
      <div style={{ width:40, height:40, border:'3px solid #567245',
        borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      <p style={{ color:'#4a5a3a', fontSize:14, fontFamily:'Outfit,sans-serif' }}>Preparing checkout...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', background:'#10140c', display:'flex',
      alignItems:'center', justifyContent:'center', flexDirection:'column',
      gap:16, textAlign:'center', padding:24 }}>
      <style>{STYLES}</style>
      <div style={{ fontSize:56 }}>⚠️</div>
      <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:26, color:'#e8f0e0', margin:0 }}>Checkout Error</h2>
      <p style={{ color:'#4a5a3a', fontSize:14, fontFamily:'Outfit,sans-serif' }}>{error}</p>
      <button onClick={() => navigate('/cart')} style={{
        background:'#567245', color:'white', border:'none', borderRadius:10,
        padding:'12px 28px', fontFamily:'Outfit,sans-serif', fontWeight:600,
        fontSize:14, cursor:'pointer'
      }}>Back to Cart</button>
    </div>
  );

  return (
    <PayPalScriptProvider options={{
      clientId: "AWgvwt0GN-KarPYS3Om2kVOqHfcrHeyLXIm39AEeg5Hx2KaU2x3xIBx7pFA8YTgsEji3Di4Q713kXEsu",
      currency: 'USD',
      intent: 'capture',
    }}>
      <div className="co-root">
        <style>{STYLES}</style>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 20px' }}>

          {/* Header */}
          <div className="fade-up" style={{ marginBottom:32 }}>
            <Link to="/cart" style={{
              display:'inline-flex', alignItems:'center', gap:6,
              fontSize:13, color:'#4a5a3a', textDecoration:'none',
              fontFamily:'Outfit,sans-serif', marginBottom:16,
              transition:'color .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color='#889679'}
              onMouseLeave={e => e.currentTarget.style.color='#4a5a3a'}>
              ← Back to cart
            </Link>
            <h1 style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:800,
              fontSize:32, color:'#e8f0e0', margin:0 }}>Checkout</h1>
          </div>

          <div className="co-layout">

            {/* LEFT — Payment */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Step 1 — Payment Method */}
              <div className="co-glass fade-up" style={{ padding:'24px 28px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <div className="step-badge">1</div>
                  <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:18,
                    fontWeight:700, color:'#e8f0e0', margin:0 }}>
                    Payment Method
                  </h2>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {/* Stripe - Coming Soon */}
                  <div className="method-card method-card-disabled">
                    <div className="coming-soon-badge">COMING SOON</div>
                    <div className="method-radio">
                      <div className="method-radio-dot" />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:600,
                          color:'#e8f0e0', fontSize:14, margin:0 }}>Credit / Debit Card</p>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px',
                          borderRadius:5, background:'rgba(99,91,255,0.12)',
                          color:'#7c75ff', border:'1px solid rgba(99,91,255,0.2)',
                          fontFamily:'Rajdhani,sans-serif', letterSpacing:'.06em' }}>
                          STRIPE
                        </span>
                      </div>
                      <p style={{ fontSize:12, color:'#4a5a3a', margin:'3px 0 0' }}>
                        Visa, Mastercard, American Express
                      </p>
                    </div>
                    <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                      {['V', 'M', 'A'].map((c, i) => (
                        <div key={i} style={{
                          width:28, height:18, borderRadius:4,
                          background: i===0?'#1A1F71':i===1?'#252525':'#016FD0',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:9, fontWeight:800, color:'white', letterSpacing:'.02em'
                        }}>{c}</div>
                      ))}
                    </div>
                  </div>

                  {/* PayPal */}
                  <div
                    className={`method-card ${method === 'paypal' ? 'selected' : ''}`}
                    onClick={() => setMethod('paypal')}
                  >
                    <div className="method-radio">
                      <div className="method-radio-dot" />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <p style={{ fontFamily:'Outfit,sans-serif', fontWeight:600,
                          color:'#e8f0e0', fontSize:14, margin:0 }}>PayPal</p>
                        <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px',
                          borderRadius:5, background:'rgba(0,48,135,0.15)',
                          color:'#009cde', border:'1px solid rgba(0,156,222,0.25)',
                          fontFamily:'Rajdhani,sans-serif', letterSpacing:'.06em' }}>
                          PAYPAL
                        </span>
                      </div>
                      <p style={{ fontSize:12, color:'#4a5a3a', margin:'3px 0 0' }}>
                        Pay with your PayPal account
                      </p>
                    </div>
                    <div style={{
                      display:'flex', alignItems:'center', gap:1,
                      fontFamily:'Arial', fontWeight:800, fontSize:16,
                    }}>
                      <span style={{ color:'#003087' }}>Pay</span>
                      <span style={{ color:'#009cde' }}>Pal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 — PayPal Checkout */}
              <div className="co-glass" style={{ padding:'24px 28px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                  <div className="step-badge">2</div>
                  <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:18,
                    fontWeight:700, color:'#e8f0e0', margin:0 }}>
                    PayPal Checkout
                  </h2>
                </div>

                <PayPalForm
                  finalTotal={finalTotal}
                  items={items}
                  discountData={discountData}
                  discountCode={discountCode}
                  onSuccess={handlePayPalSuccess}
                  onError={handlePayPalError}
                />
              </div>

              {/* Security Badges */}
              <div style={{ display:'flex', justifyContent:'center', gap:20, flexWrap:'wrap' }}>
                {[
                  { icon:'🔒', text:'256-bit SSL Encryption' },
                  { icon:'⚡', text:'Instant Code Delivery' },
                  { icon:'✅', text:'Verified Seller' },
                ].map(b => (
                  <span key={b.text} className="security-badge">
                    <span>{b.icon}</span> {b.text}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT — Order Summary */}
            <div className="co-glass co-summary" style={{ padding:'24px' }}>
              <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:800,
                fontSize:18, color:'#e8f0e0', marginBottom:20 }}>
                Order Summary
              </h2>

              <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <img
                        src={getImageUrl(item.image) || `https://placehold.co/44x44/161b11/567245?text=${(item.name||'?')[0]}`}
                        alt={item.name}
                        style={{ width:44, height:44, borderRadius:10, objectFit:'cover',
                          border:'1px solid #2a3420' }}
                        onError={e => { e.target.src=`https://placehold.co/44x44/161b11/567245?text=${(item.name||'?')[0]}`; }}
                      />
                      {item.quantity > 1 && (
                        <span style={{
                          position:'absolute', top:-6, right:-6,
                          width:16, height:16, borderRadius:'50%',
                          background:'#567245', color:'white',
                          fontSize:9, fontWeight:700,
                          display:'flex', alignItems:'center', justifyContent:'center',
                        }}>{item.quantity}</span>
                      )}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:12, color:'#e8f0e0', fontWeight:500,
                        margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.name}
                      </p>
                      <p style={{ fontSize:11, color:'#4a5a3a', margin:'2px 0 0' }}>
                        × {item.quantity}
                      </p>
                    </div>
                    <span style={{ fontSize:13, fontWeight:600, color:'#c4d6a1', flexShrink:0 }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ height:1, background:'#2a3420', margin:'16px 0' }} />

              {/* Discount Code */}
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', gap:8 }}>
                  <input
                    value={discountCode}
                    onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscountData(null); }}
                    placeholder="Discount code"
                    disabled={!!discountData}
                    style={{
                      flex:1, background:'#1a1f14',
                      border:`1px solid ${discountData ? 'rgba(34,197,94,0.4)' : '#2a3420'}`,
                      borderRadius:10, padding:'10px 12px', color:'#e8f0e0',
                      fontSize:13, fontFamily:'Outfit,sans-serif', outline:'none',
                      fontWeight:600, letterSpacing:'.05em',
                    }}
                  />
                  {discountData ? (
                    <button
                      onClick={() => { setDiscountData(null); setDiscountCode(''); }}
                      style={{
                        background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)',
                        borderRadius:10, padding:'10px 14px', color:'#f87171',
                        fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
                      }}
                    >Remove</button>
                  ) : (
                    <button
                      onClick={handleApplyDiscount}
                      disabled={discountLoading || !discountCode.trim()}
                      style={{
                        background:'#567245', border:'none', borderRadius:10,
                        padding:'10px 16px', color:'white',
                        fontSize:12, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap',
                        opacity: discountLoading || !discountCode.trim() ? 0.5 : 1,
                      }}
                    >{discountLoading ? '...' : 'Apply'}</button>
                  )}
                </div>
                {discountData && (
                  <p style={{ fontSize:11, color:'#22c55e', margin:'6px 0 0', fontWeight:600 }}>
                    ✅ {discountData.discount.description || discountData.discount.code} applied
                  </p>
                )}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13, color:'#4a5a3a' }}>Subtotal</span>
                  <span style={{ fontSize:13, color:'#e8f0e0' }}>${total.toFixed(2)}</span>
                </div>
                {discountData && (
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:13, color:'#22c55e' }}>Discount</span>
                    <span style={{ fontSize:13, color:'#22c55e', fontWeight:700 }}>-${discountData.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13, color:'#4a5a3a' }}>Tax</span>
                  <span style={{ fontSize:13, color:'#22c55e' }}>$0.00</span>
                </div>
              </div>

              <div style={{ height:1, background:'#2a3420', marginBottom:16 }} />

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700,
                  fontSize:16, color:'#e8f0e0' }}>Total</span>
                <div style={{ textAlign:'right' }}>
                  {discountData && (
                    <p style={{ fontSize:12, color:'#4a5a3a', margin:'0 0 2px',
                      textDecoration:'line-through' }}>${total.toFixed(2)}</p>
                  )}
                  <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:800,
                    fontSize:28, color: discountData ? '#22c55e' : '#e8f0e0' }}>
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div style={{
                background:'rgba(34,197,94,0.05)', border:'1px solid rgba(34,197,94,0.15)',
                borderRadius:10, padding:'12px 14px',
              }}>
                <p style={{ fontSize:11, fontWeight:600, color:'#22c55e',
                  margin:'0 0 6px', display:'flex', alignItems:'center', gap:6 }}>
                  ⚡ What happens after payment?
                </p>
                <ul style={{ margin:0, padding:'0 0 0 14px', fontSize:11,
                  color:'#4a6a4a', lineHeight:1.8 }}>
                  <li>Digital codes sent instantly to your email</li>
                  <li>Order saved in your account</li>
                  <li>Copy codes from your orders page</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}