import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

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
  .method-card:hover { border-color: #567245; background: #1a2014; }
  .method-card.selected {
    border-color: #567245;
    background: rgba(86,114,69,0.08);
    box-shadow: 0 0 0 1px #567245;
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
  .pay-btn-paypal {
    background: linear-gradient(135deg, #003087, #009cde);
    color: white;
  }
  .pay-btn-paypal:hover:not(:disabled) {
    background: linear-gradient(135deg, #003fa8, #00b2ff);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0,156,222,0.3);
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
`;

// ── Stripe Card Form (UI فقط — هنوصّله بعدين) ─────────────────────────────
function StripeForm({ onSubmit, loading, total }) {
  const [card, setCard] = useState({
    number: '', expiry: '', cvc: '', name: ''
  });

  const formatCardNumber = (val) => {
    return val.replace(/\D/g, '').slice(0, 16)
      .replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 2) return clean.slice(0, 2) + '/' + clean.slice(2);
    return clean;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanNumber = card.number.replace(/\s/g, '');
    if (cleanNumber.length < 16) return toast.error('Please enter a valid card number');
    if (card.expiry.length < 5)  return toast.error('Please enter a valid expiry date');
    if (card.cvc.length < 3)     return toast.error('Please enter a valid CVC');
    if (!card.name.trim())        return toast.error('Please enter the cardholder name');
    onSubmit(card);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 fade-up">
      {/* Cardholder Name */}
      <div>
        <label style={{ display:'block', fontSize:11, fontWeight:600,
          color:'#889679', marginBottom:7, textTransform:'uppercase', letterSpacing:'.06em' }}>
          Cardholder Name
        </label>
        <input
          value={card.name}
          onChange={e => setCard(c => ({ ...c, name: e.target.value }))}
          placeholder="John Doe"
          className="co-input"
        />
      </div>

      {/* Card Number */}
      <div>
        <label style={{ display:'block', fontSize:11, fontWeight:600,
          color:'#889679', marginBottom:7, textTransform:'uppercase', letterSpacing:'.06em' }}>
          Card Number
        </label>
        <div className="card-input-group">
          <div style={{ display:'flex', alignItems:'center', padding:'0 14px' }}>
            <input
              value={card.number}
              onChange={e => setCard(c => ({ ...c, number: formatCardNumber(e.target.value) }))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="card-field"
              style={{ padding:'12px 0' }}
            />
            {/* Card Brand Icon */}
            <div style={{ flexShrink:0, marginLeft:8 }}>
              {card.number.startsWith('4') ? (
                <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
                  <rect width="32" height="20" rx="3" fill="#1A1F71"/>
                  <path d="M13.5 14H11L12.8 6H15.3L13.5 14ZM10 6L7.6 11.3L7.3 9.8L6.4 6.7C6.2 6.2 5.8 6 5.4 6H2V6.2C3 6.4 3.9 6.8 4.7 7.3L6.9 14H9.5L13.1 6H10ZM28 14H25.8L25.5 12.8H22.5L22 14H19.5L22.9 6H25.7C26.5 6 27 6.4 27.2 7.1L28 14ZM24.9 11L24.2 8.2L23.2 11H24.9ZM20 6L17.7 11.8L17.5 11L16.5 7.1C16.3 6.4 15.7 6.1 15 6H11.5L11.4 6.3C12.6 6.6 13.6 7.2 14.4 8L16.8 14H19.4L23.1 6H20Z" fill="#F7B600"/>
                </svg>
              ) : card.number.startsWith('5') ? (
                <div style={{ display:'flex', gap:2 }}>
                  <div style={{ width:16, height:16, borderRadius:'50%', background:'#EB001B', opacity:.9 }} />
                  <div style={{ width:16, height:16, borderRadius:'50%', background:'#F79E1B', opacity:.9, marginLeft:-6 }} />
                </div>
              ) : (
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#3a4a2a" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expiry + CVC */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:600,
            color:'#889679', marginBottom:7, textTransform:'uppercase', letterSpacing:'.06em' }}>
            Expiry Date
          </label>
          <input
            value={card.expiry}
            onChange={e => setCard(c => ({ ...c, expiry: formatExpiry(e.target.value) }))}
            placeholder="MM/YY"
            maxLength={5}
            className="co-input"
          />
        </div>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:600,
            color:'#889679', marginBottom:7, textTransform:'uppercase', letterSpacing:'.06em' }}>
            CVC
          </label>
          <input
            value={card.cvc}
            onChange={e => setCard(c => ({ ...c, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
            placeholder="123"
            maxLength={4}
            className="co-input"
            type="password"
          />
        </div>
      </div>

      {/* Test Mode Notice */}
      <div style={{
        background:'rgba(99,91,255,0.06)', border:'1px solid rgba(99,91,255,0.2)',
        borderRadius:10, padding:'10px 14px',
        display:'flex', alignItems:'flex-start', gap:8,
      }}>
        <span style={{ fontSize:14 }}>🧪</span>
        <div>
          <p style={{ fontSize:11, color:'rgba(99,91,255,0.9)', fontWeight:600, margin:0 }}>Test Mode</p>
          <p style={{ fontSize:11, color:'rgba(99,91,255,0.6)', margin:'2px 0 0' }}>
            Use card: <span style={{ fontFamily:'monospace', color:'rgba(99,91,255,0.9)' }}>4242 4242 4242 4242</span> · Any future date · Any CVC
          </p>
        </div>
      </div>

      <button type="submit" disabled={loading} className="pay-btn pay-btn-stripe" style={{ marginTop:8 }}>
        {loading ? (
          <>
            <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" style={{opacity:.25}}/>
              <path fill="white" d="M4 12a8 8 0 018-8v8H4z" style={{opacity:.75}}/>
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Pay ${total.toFixed(2)} with Stripe
          </>
        )}
      </button>
    </form>
  );
}

// ── PayPal Form (UI فقط — هنوصّله بعدين) ──────────────────────────────────
function PayPalForm({ onSubmit, loading, total }) {
  return (
    <div className="fade-up space-y-4">
      {/* PayPal Info */}
      <div style={{
        background:'rgba(0,48,135,0.08)', border:'1px solid rgba(0,156,222,0.2)',
        borderRadius:12, padding:'20px',
        display:'flex', flexDirection:'column', alignItems:'center', gap:12,
      }}>
        {/* PayPal Logo */}
        <svg width="100" height="26" viewBox="0 0 100 26" fill="none">
          <text x="0" y="20" fontFamily="Arial" fontWeight="800" fontSize="22" fill="#003087">Pay</text>
          <text x="36" y="20" fontFamily="Arial" fontWeight="800" fontSize="22" fill="#009cde">Pal</text>
        </svg>
        <p style={{ fontSize:13, color:'#4a6a8a', textAlign:'center', margin:0 }}>
          You'll be redirected to PayPal to complete your payment securely
        </p>
        <div style={{ display:'flex', gap:16, fontSize:11, color:'#3a5a7a' }}>
          <span>🔒 Buyer Protection</span>
          <span>⚡ Instant Transfer</span>
          <span>🌍 Global</span>
        </div>
      </div>

      {/* Test Mode Notice */}
      <div style={{
        background:'rgba(0,156,222,0.06)', border:'1px solid rgba(0,156,222,0.2)',
        borderRadius:10, padding:'10px 14px',
        display:'flex', alignItems:'flex-start', gap:8,
      }}>
        <span style={{ fontSize:14 }}>🧪</span>
        <div>
          <p style={{ fontSize:11, color:'rgba(0,156,222,0.9)', fontWeight:600, margin:0 }}>Sandbox Mode</p>
          <p style={{ fontSize:11, color:'rgba(0,156,222,0.6)', margin:'2px 0 0' }}>
            Use your PayPal Sandbox test account to complete payment
          </p>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="pay-btn pay-btn-paypal"
      >
        {loading ? (
          <>
            <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" style={{opacity:.25}}/>
              <path fill="white" d="M4 12a8 8 0 018-8v8H4z" style={{opacity:.75}}/>
            </svg>
            Redirecting to PayPal...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Pay ${total.toFixed(2)} with PayPal
          </>
        )}
      </button>
    </div>
  );
}

// ── Main Checkout Page ────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { items, total, clearCart, isEmpty } = useCart();
  const navigate = useNavigate();

  const [method, setMethod]       = useState('stripe'); // 'stripe' | 'paypal'
  const [loading, setLoading]     = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [orderId, setOrderId]     = useState('');
  const [error, setError]         = useState('');

  useEffect(() => {
    if (isEmpty) { navigate('/cart'); return; }
    initCheckout();
  }, []);

  const initCheckout = async () => {
    setInitLoading(true);
    setError('');
    try {
      const res = await paymentAPI.createPaymentIntent(
        items.map(i => ({
          productId: i.product?.toString() || i.productId,
          quantity:  i.quantity
        }))
      );
      setOrderId(res.data.orderId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize checkout');
    } finally {
      setInitLoading(false);
    }
  };

  // ── Stripe Handler (هنوصّله بعدين بالـ Keys) ─────────────────────────────
  const handleStripeSubmit = async (cardData) => {
    setLoading(true);
    try {
      // مؤقتاً — confirm عادي
      await paymentAPI.confirmPayment(orderId);
      clearCart();
      toast.success('Payment successful! 🎉 Codes sent to your email');
      navigate(`/orders/${orderId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // ── PayPal Handler (هنوصّله بعدين بالـ Keys) ─────────────────────────────
  const handlePayPalSubmit = async () => {
    setLoading(true);
    try {
      // مؤقتاً — confirm عادي
      await paymentAPI.confirmPayment(orderId);
      clearCart();
      toast.success('PayPal payment successful! 🎉');
      navigate(`/orders/${orderId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'PayPal payment failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
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
      <button onClick={initCheckout} style={{
        background:'#567245', color:'white', border:'none', borderRadius:10,
        padding:'12px 28px', fontFamily:'Outfit,sans-serif', fontWeight:600,
        fontSize:14, cursor:'pointer'
      }}>Try Again</button>
    </div>
  );

  return (
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

        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:28, alignItems:'start' }}>

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
                {/* Stripe Option */}
                <div
                  className={`method-card ${method === 'stripe' ? 'selected' : ''}`}
                  onClick={() => setMethod('stripe')}
                >
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
                  {/* Card Icons */}
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

                {/* PayPal Option */}
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

            {/* Step 2 — Payment Details */}
            <div className="co-glass" style={{ padding:'24px 28px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                <div className="step-badge">2</div>
                <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontSize:18,
                  fontWeight:700, color:'#e8f0e0', margin:0 }}>
                  {method === 'stripe' ? 'Card Details' : 'PayPal Checkout'}
                </h2>
              </div>

              {method === 'stripe' && (
                <StripeForm
                  onSubmit={handleStripeSubmit}
                  loading={loading}
                  total={total}
                />
              )}
              {method === 'paypal' && (
                <PayPalForm
                  onSubmit={handlePayPalSubmit}
                  loading={loading}
                  total={total}
                />
              )}
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
          <div className="co-glass" style={{ padding:'24px', position:'sticky', top:96 }}>
            <h2 style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:800,
              fontSize:18, color:'#e8f0e0', marginBottom:20 }}>
              Order Summary
            </h2>

            {/* Items */}
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
              {items.map((item, i) => {
                const pid = item.product?.toString() || item.productId;
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ position:'relative', flexShrink:0 }}>
                      <img
                        src={item.image || `https://placehold.co/44x44/161b11/567245?text=${(item.name||'?')[0]}`}
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
                );
              })}
            </div>

            {/* Divider */}
            <div style={{ height:1, background:'#2a3420', margin:'16px 0' }} />

            {/* Totals */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, color:'#4a5a3a' }}>Subtotal</span>
                <span style={{ fontSize:13, color:'#e8f0e0' }}>${total.toFixed(2)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, color:'#4a5a3a' }}>Tax</span>
                <span style={{ fontSize:13, color:'#22c55e' }}>$0.00</span>
              </div>
            </div>

            <div style={{ height:1, background:'#2a3420', marginBottom:16 }} />

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700,
                fontSize:16, color:'#e8f0e0' }}>Total</span>
              <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:800,
                fontSize:28, color:'#e8f0e0' }}>${total.toFixed(2)}</span>
            </div>

            {/* What you get */}
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
  );
}