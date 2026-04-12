import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUSES = ['','pending','paid','processing','completed','failed','refunded','cancelled'];
const STATUS_STYLES = {
  pending:'bg-yellow-500/10 text-yellow-400', paid:'bg-blue-500/10 text-blue-400',
  processing:'bg-blue-500/10 text-blue-400', completed:'bg-green-500/10 text-green-400',
  failed:'bg-red-500/10 text-red-400', refunded:'bg-gray-500/10 text-gray-400',
  cancelled:'bg-red-500/10 text-red-400',
};

export default function AdminOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);

  useEffect(() => { loadOrders(); }, [status, page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (status) params.status = status;
      const res = await orderAPI.getAll(params);
      setOrders(res.data.orders);
      setTotal(res.data.total);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      toast.success('Order status updated');
      loadOrders();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div className="page-enter pt-20 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="font-display font-bold text-3xl text-white">Orders <span className="text-gray-500 font-normal text-xl">({total})</span></h1>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-field py-2 text-sm w-40">
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
          </select>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Order #','Customer','Items','Total','Status','Date','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-4 text-xs text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? [...Array(8)].map((_,i) => (
                  <tr key={i}>{[...Array(7)].map((_,j) => <td key={j} className="px-4 py-4"><div className="skeleton h-4 rounded w-20"/></td>)}</tr>
                )) : orders.map(order => (
                  <tr key={order._id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-4">
                      <span className="font-mono text-primary-400 text-sm">{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-white">{order.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[140px]">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-white">${order.totalAmount?.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order._id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${STATUS_STYLES[order.status] || ''}`}
                        style={{ background: 'transparent' }}
                      >
                        {STATUSES.filter(Boolean).map(s => <option key={s} value={s} style={{ background: '#1a1a35' }}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <Link to={`/orders/${order._id}`} className="text-xs px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && orders.length === 0 && (
              <div className="text-center py-12 text-gray-500">No orders found</div>
            )}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-gray-500">Showing {(page-1)*20+1}–{Math.min(page*20, total)} of {total}</span>
              <div className="flex gap-2">
                <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">← Prev</button>
                <button disabled={page*20>=total} onClick={() => setPage(p=>p+1)} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
