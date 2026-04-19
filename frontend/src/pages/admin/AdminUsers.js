import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ALL_ROLES = ['user', 'editor', 'admin', 'manager', 'co-owner', 'owner', 'hidden'];

const PERMISSIONS_LIST = [
  { id: 'manage_products',     label: 'Manage Products',      icon: '📦' },
  { id: 'manage_orders',       label: 'Manage Orders',        icon: '🧾' },
  { id: 'manage_maintenance',  label: 'Maintenance Mode',     icon: '🔧' },
  { id: 'view_analytics',      label: 'Financial Analytics',  icon: '📊' },
  { id: 'manage_users',        label: 'User Management',      icon: '👥' },
  { id: 'manage_settings',     label: 'System Settings',      icon: '⚙️' },
  { id: 'view_ledger',         label: 'Ledger Access',        icon: '💰' },
];


export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [editTarget, setEditTarget] = useState(null);
  const [viewingActivity, setViewingActivity] = useState(null); 
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null); // للتحكم في فتح الأوردر

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ limit: 100 });
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally { setLoading(false); }
  };

  const togglePermission = (id) => {
    setSelectedPerms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold leading-none">Manage Users</h1>
          <p className="text-sm text-white  font-normal">Terminal Access </p>
        </div>
        
        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] text-xs text-neutral-100 border-b border-white/5 font-semibold">
              <tr>
                <th className="px-8 py-7">User Profile</th>
                <th className="px-8 py-7 text-center">Investment_Stats</th>
                <th className="px-8 py-7 text-center">Role</th>
                <th className="px-8 py-7 text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-white/[0.01] transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-white/10 flex items-center justify-center font-bold group-hover:border-[#22c55e]/50 transition-all shadow-inner">
                        {u.name?.[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{u.name}</p>
                        <p className="text-xs text-zinc-600 font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center gap-1">
                       <span className="text-xs text-[#22c55e] font-semibold">${u.totalSpent?.toFixed(2) || '0.00'}</span>
                       <span className="text-[13px] text-zinc-600 font-normal">{u.orderCount || 0} Orders</span>
                    </div>
                  </td>

                  <td className="px-8 py-6 text-center">
                    <span className="text-xs bg-zinc-800/80 px-3 py-1.5 rounded-lg font-semibold border border-white/10 text-zinc-400">
                      {u.role}
                    </span>
                  </td>

                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => { setViewingActivity(u); setExpandedOrderId(null); }}
                        className="text-xs font-semibold py-2.5 px-6 rounded-xl bg-zinc-800 text-white border border-white/10 hover:bg-white hover:text-black transition-all"
                      >
                        Activity
                      </button>
                      <button 
                        onClick={() => { setEditTarget(u); setSelectedRole(u.role); setSelectedPerms(u.permissions || []); }}
                        className="text-xs font-semibold py-2.5 px-6 rounded-xl bg-white text-black hover:bg-[#22c55e] hover:text-white transition-all shadow-xl active:scale-95"
                      >
                        Access
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ACTIVITY MODAL: عرض الأوردرات وجواها الأيتيمز --- */}
      {viewingActivity && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl transition-all animate-in fade-in">
          <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col max-h-[85vh]">
            
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div>
                <h2 className="text-2xl font-bold text-white">Activity Terminal</h2>
                <p className="text-xs text-[#22c55e] font-semibold mt-1">Operator: {viewingActivity.name}</p>
              </div>
              <button 
                onClick={() => setViewingActivity(null)}
                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-xl"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
              {viewingActivity.orderHistory && viewingActivity.orderHistory.length > 0 ? (
                viewingActivity.orderHistory.map((order) => (
                  <div key={order._id} className="bg-zinc-900/30 border border-white/5 rounded-[2rem] overflow-hidden group/order">
                    {/* رأس الأوردر */}
                    <div 
                      onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                      className="p-6 flex justify-between items-center cursor-pointer hover:bg-white/[0.02] transition-all"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-zinc-600">Batch ID: {order._id.slice(-8)}</span>
                        <span className="text-sm font-semibold text-white">{new Date(order.createdAt).toDateString()}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md w-fit"
                          style={{
                            background: order.paymentMethod === 'paypal' ? 'rgba(0,112,240,0.1)' : 'rgba(99,91,255,0.1)',
                            color: order.paymentMethod === 'paypal' ? '#0070f0' : '#635bff',
                            border: `1px solid ${order.paymentMethod === 'paypal' ? 'rgba(0,112,240,0.3)' : 'rgba(99,91,255,0.3)'}`,
                          }}>
                          {order.paymentMethod === 'paypal' ? '🅿 PayPal' : '💳 Stripe'}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs text-zinc-600 mb-1">Value</p>
                          <p className="text-lg font-bold text-[#22c55e]">${order.totalAmount?.toFixed(2)}</p>
                        </div>
                        <div className={`w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center transition-all ${expandedOrderId === order._id ? 'rotate-180 bg-[#22c55e] border-[#22c55e] text-black' : 'bg-black'}`}>
                          ↓
                        </div>
                      </div>
                    </div>

                    {/* المنتجات داخل الأوردر (Items Inside Order) */}
                    {expandedOrderId === order._id && (
                      <div className="px-6 pb-6 pt-2 space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <div className="h-px bg-white/5 mb-4" />
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/[0.03] hover:border-[#22c55e]/20">
                           
<div className="flex items-center gap-4">
  <div className="w-12 h-12 bg-zinc-900 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
    {getImageUrl(item.image) ? (
      <img 
        src={getImageUrl(item.image)} 
        alt={item.name} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
      />
    ) : (
      <div className="text-[8px] font-black text-zinc-600 italic uppercase">No_Img</div>
    )}
  </div>
  <div>
    <p className="text-xs font-black text-white uppercase tracking-tight">{item.name}</p>
    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Quantity: {item.quantity}</p>
  </div>
</div>
                            <span className="text-xs font-semibold text-white font-mono">${item.price?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-32 opacity-50 text-xs font-normal">No Transactions In Memory</div>
              )}
            </div>

            {/* الفوتر الخاص بالنافذة */}
            <div className="p-10 bg-white/[0.01] border-t border-white/5 backdrop-blur-3xl flex justify-between items-center">
              <div>
                <p className="text-xs text-zinc-600 font-normal mb-1 text-left">Cumulative Worth</p>
                <p className="text-3xl font-bold text-white leading-none">${viewingActivity.totalSpent?.toFixed(2)}</p>
              </div>
             
            </div>
          </div>
        </div>
      )}

      {/* --- ACCESS MODAL: التحكم بالرتب والصلاحيات --- */}
      {editTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl">
            <h2 className="text-2xl font-bold mb-8 text-white border-l-4 border-[#22c55e] pl-5">Permissions Module</h2>
            <div className="space-y-6">
              <div>
                <label className="text-xs text-zinc-500 font-semibold mb-3 block">Authorization Level</label>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-xs font-semibold outline-none focus:border-[#22c55e] transition-all"
                >
                  {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-xs text-zinc-500 font-semibold mb-3 block">Capability Stack</label>
                <div className="space-y-2">
                  {PERMISSIONS_LIST.map(perm => {
                    const active = selectedPerms.includes(perm.id);
                    return (
                      <div 
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${active ? 'bg-[#22c55e]/5 border-[#22c55e]/40' : 'bg-black border-white/5 opacity-40 hover:opacity-100'}`}
                      >
                        <span className="text-xs font-semibold">{perm.label}</span>
                        <div className={`w-4 h-4 rounded border ${active ? 'bg-[#22c55e] border-[#22c55e]' : 'border-zinc-700'}`}></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                  onClick={async () => {
                    try {
                      await adminAPI.updateUserRole(editTarget._id, { role: selectedRole, permissions: selectedPerms });
                      toast.success('PROTOCOL_UPDATED');
                      setEditTarget(null);
                      loadUsers();
                    } catch (err) { toast.error('ERROR'); }
                  }}
                  className="py-4 bg-white text-black rounded-xl font-semibold text-xs hover:bg-[#22c55e] transition-all"
                >Apply</button>
                <button 
                  onClick={() => setEditTarget(null)}
                  className="py-4 bg-zinc-900 text-zinc-600 rounded-xl font-semibold text-xs border border-white/5"
                >Abort</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}