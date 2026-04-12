import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from "react-toastify";
import { orderAPI } from '../services/api';

const STATUS_STYLES = {
  pending:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  paid:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed:  'bg-green-500/10 text-green-400 border-green-500/20',
  failed:     'bg-red-500/10 text-red-400 border-red-500/20',
  refunded:   'bg-gray-500/10 text-gray-400 border-gray-500/20',
  cancelled:  'bg-red-500/10 text-red-400 border-red-500/20',
};

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getMyOrders()
      .then(res => setOrders(res.data.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="page-enter pt-20 pb-16 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display font-bold text-3xl text-white mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="font-display font-semibold text-white text-xl mb-2">No orders yet</h3>
            <p className="text-gray-400 mb-6">Your order history will appear here</p>
            <Link to="/products" className="btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="glass rounded-2xl p-5 flex items-center gap-4 hover:border-primary-500/30 transition-all duration-200 block group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-primary-400 text-sm font-semibold">{order.orderNumber}</span>
                    <span className={`badge border text-xs ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {order.items?.map(i => i.name || i.product?.name).filter(Boolean).join(', ')}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display font-bold text-white text-lg">${order.totalAmount?.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1 group-hover:text-primary-400 transition-colors">View details →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCodes, setShowCodes] = useState({});

  useEffect(() => {
    orderAPI.getOne(id)
      .then(res => setOrder(res.data.order))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="pt-20 min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-4">😕</div>
      <h2 className="font-display font-bold text-2xl text-white mb-2">Order Not Found</h2>
      <Link to="/orders" className="btn-primary mt-4">Back to Orders</Link>
    </div>
  );

  return (
    <div className="page-enter pt-20 pb-16 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to="/orders" className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1 mb-4">
            ← Back to orders
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-2xl sm:text-3xl text-white">Order Details</h1>
              <p className="font-mono text-primary-400 mt-1">{order.orderNumber}</p>
            </div>
            <span className={`badge border px-4 py-2 text-sm rounded-xl ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Status Banner */}
        {order.status === 'completed' && (
          <div className="glass rounded-2xl p-4 border border-green-500/30 bg-green-500/5 mb-6 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-green-400 font-semibold">Order Fulfilled!</p>
              <p className="text-gray-400 text-sm">Your codes have been sent to your email{order.emailSent ? ' and are shown below' : ''}.</p>
            </div>
          </div>
        )}

        {/* Items & Codes */}
        <div className="space-y-4 mb-6">
          {order.items?.map((item, idx) => (
            <div key={idx} className="glass rounded-2xl p-5">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={item.image || `https://placehold.co/60x60/1a1a35/6366f1?text=${(item.name || '?')[0]}`}
                  alt={item.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  onError={e => { e.target.src = `https://placehold.co/60x60/1a1a35/6366f1?text=${(item.name || '?')[0]}`; }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{item.name || item.product?.name}</h3>
                  <p className="text-gray-400 text-sm">Qty: {item.quantity} × ${item.price?.toFixed(2)}</p>
                </div>
                <span className="font-bold text-white">${(item.price * item.quantity).toFixed(2)}</span>
              </div>

              {/* Digital Codes */}
              {item.codes?.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowCodes(s => ({ ...s, [idx]: !s[idx] }))}
                    className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors mb-3"
                  >
                    <svg className={`w-4 h-4 transition-transform ${showCodes[idx] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {showCodes[idx] ? 'Hide' : 'Show'} {item.codes.length} code{item.codes.length > 1 ? 's' : ''}
                  </button>

                  {showCodes[idx] && (
                    <div className="space-y-2">
                      {item.codes.map((code, ci) => (
                        <div key={ci} className="code-display rounded-xl p-4 flex items-center justify-between gap-3">
                          <span className="font-mono text-primary-300 text-sm sm:text-base tracking-widest break-all">
                            {code.code || code}
                          </span>
                          <button
                            onClick={() => { navigator.clipboard.writeText(code.code || code); toast.success('Code copied!'); }}
                            className="flex-shrink-0 p-2 rounded-lg bg-primary-500/20 hover:bg-primary-500/40 text-primary-400 transition-colors"
                            title="Copy code"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="glass rounded-2xl p-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-white">${order.totalAmount?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-2">
            <span className="font-semibold text-white">Total</span>
            <span className="font-display font-bold text-xl text-white">${order.totalAmount?.toFixed(2)}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-500 space-y-1">
            <p>Payment: {order.paymentMethod}</p>
            <p>Placed: {new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrdersPage;
