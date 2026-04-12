import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ROLES = ['user','editor','admin','manager','co-owner','owner'];
const ROLE_COLORS = {
  user:'text-gray-400', editor:'text-blue-400', admin:'text-purple-400',
  manager:'text-amber-400', 'co-owner':'text-pink-400', owner:'text-yellow-400',
};

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { loadUsers(); }, [search, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success('Role updated');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await adminAPI.toggleUserStatus(userId);
      toast.success(`User ${action}d`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const meLevel = { user:0,editor:1,admin:2,manager:3,'co-owner':4,owner:5 };

  return (
    <div className="page-enter pt-20 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display font-bold text-3xl text-white mb-8">Users <span className="text-gray-500 font-normal text-xl">({users.length})</span></h1>

        <div className="flex gap-4 mb-6 flex-wrap">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input-field max-w-xs"
          />
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field py-2 text-sm w-36">
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['User','Role','Status','Joined','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-4 text-xs text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? [...Array(8)].map((_,i) => (
                  <tr key={i}>{[...Array(5)].map((_,j) => <td key={j} className="px-4 py-4"><div className="skeleton h-4 rounded w-24"/></td>)}</tr>
                )) : users.map(user => (
                  <tr key={user._id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white flex items-center gap-2">
                            {user.name}
                            {user._id === me?._id && <span className="text-xs bg-primary-500/20 text-primary-400 px-1.5 py-0.5 rounded">You</span>}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {/* Only allow role changes for users with lower level than me */}
                      {user._id !== me?._id && (meLevel[me?.role]||0) > (meLevel[user.role]||0) ? (
                        <select
                          value={user.role}
                          onChange={e => handleRoleChange(user._id, e.target.value)}
                          className={`text-xs bg-surface-700 border border-white/10 rounded-lg px-2 py-1 outline-none cursor-pointer ${ROLE_COLORS[user.role]}`}
                        >
                          {ROLES.filter(r => (meLevel[r]||0) < (meLevel[me?.role]||0)).map(r => (
                            <option key={r} value={r} style={{ background: '#1a1a35' }}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`text-sm capitalize font-medium ${ROLE_COLORS[user.role]}`}>{user.role}</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge text-xs ${user.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      {user._id !== me?._id && user.role !== 'owner' && (
                        <button
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                            user.isActive
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                          }`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && users.length === 0 && (
              <div className="text-center py-12 text-gray-500">No users found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
