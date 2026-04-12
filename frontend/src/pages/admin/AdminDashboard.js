import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="glass rounded-2xl p-6">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${color}`}>{icon}</div>
    </div>
    <p className="font-display font-bold text-3xl text-white mb-1">{value}</p>
    <p className="text-gray-400 text-sm">{label}</p>
    {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const navItems = [
    { to: '/admin/products', label: 'Products',  icon: '📦', desc: 'Add, edit, manage products' },
    { to: '/admin/codes',    label: 'Codes',     icon: '🔑', desc: 'Upload & manage digital codes' },
    { to: '/admin/orders',   label: 'Orders',    icon: '🛒', desc: 'View & process orders' },
    { to: '/admin/users',    label: 'Users',     icon: '👥', desc: 'Manage user roles' },
  ];

  if (loading) return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="page-enter pt-20 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link to="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-gray-400">Admin</span>
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">Admin Dashboard</h1>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Revenue"
              value={`$${(stats.totalRevenue || 0).toFixed(2)}`}
              icon="💰"
              color="bg-green-500/10"
            />
            <StatCard
              label="Total Orders"
              value={stats.totalOrders || 0}
              icon="🛒"
              color="bg-blue-500/10"
            />
            <StatCard
              label="Products"
              value={stats.totalProducts || 0}
              icon="📦"
              color="bg-purple-500/10"
            />
            <StatCard
              label="Users"
              value={stats.totalUsers || 0}
              icon="👥"
              color="bg-pink-500/10"
            />
          </div>
        )}

        {/* Quick Nav */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="glass rounded-2xl p-5 hover:border-primary-500/30 transition-all duration-200 group"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <p className="font-display font-semibold text-white group-hover:text-primary-400 transition-colors">{item.label}</p>
              <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-white">Recent Orders</h2>
              <Link to="/admin/orders" className="text-sm text-primary-400 hover:text-primary-300">View all →</Link>
            </div>
            <div className="space-y-3">
              {stats?.recentOrders?.length === 0 && <p className="text-gray-500 text-sm">No recent orders</p>}
              {stats?.recentOrders?.map(order => (
                <Link key={order._id} to={`/orders/${order._id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/3 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-primary-400">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 truncate">{order.user?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">${order.totalAmount?.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'completed' ? 'text-green-400 bg-green-500/10' :
                      order.status === 'pending'   ? 'text-yellow-400 bg-yellow-500/10' :
                      'text-gray-400 bg-gray-500/10'
                    }`}>{order.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Low Stock */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-semibold text-white">Low Stock Alert</h2>
              <Link to="/admin/codes" className="text-sm text-primary-400 hover:text-primary-300">Add codes →</Link>
            </div>
            <div className="space-y-3">
              {stats?.lowStockProducts?.length === 0 && <p className="text-gray-500 text-sm">All products well stocked ✅</p>}
              {stats?.lowStockProducts?.map(product => (
                <div key={product._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${product.stock === 0 ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <p className="text-sm text-white flex-1 truncate">{product.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    product.stock === 0 ? 'text-red-400 bg-red-500/10' : 'text-yellow-400 bg-yellow-500/10'
                  }`}>
                    {product.stock} left
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
