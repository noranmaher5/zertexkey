import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/imageUrl';

const CATEGORIES = ['roblox', 'minecraft', 'steam', 'discord', 'chatgpt', 'movies', 'gift-cards', 'ebooks', 'games', 'general'];

const EMPTY_FORM = { 
  name: '', 
  description: '', 
  shortDescription: '', 
  category: 'general', 
  platform: '', 
  region: 'Global', 
  price: '', 
  originalPrice: '', 
  stock: 0,
  image: null, 
  tags: '', 
  isFeatured: false, 
  isUnlimited: false, 
  isActive: true,
  extraInfo: '', 
  youtubeUrl: '',
  reviews: []
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('live'); 
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { 
    loadProducts(); 
  }, [page, activeTab]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({ 
        page, 
        limit: 10, 
        isAdmin: true,
        activeTab: activeTab 
      });
      
      if (res.data && res.data.products) {
        setProducts(res.data.products);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) { 
      toast.error('Failed to load products'); 
    } finally { 
      setLoading(false); 
    }
  };

  const openCreate = () => { 
    setForm(EMPTY_FORM); 
    setEditing(null); 
    setModal(true); 
  };
  
  const openEdit = (p) => {
    setForm({ 
      ...p, 
      tags: p.tags?.join(', ') || '', 
      price: p.price.toString(), 
      originalPrice: (p.originalPrice || '').toString(),
      stock: p.stock || 0,
      image: null,
      reviews: p.reviews || []
    });
    setEditing(p._id);
    setModal(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await productAPI.deleteReview(editing, reviewId);
      toast.success('Comment deleted');
      
      setForm(f => ({
        ...f,
        reviews: f.reviews.filter(r => r._id !== reviewId)
      }));
      
      loadProducts(); 
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'tags') {
          const tagsArray = form.tags && typeof form.tags === 'string' 
            ? form.tags.split(',').map(t => t.trim()).filter(Boolean) 
            : [];
          formData.append('tags', JSON.stringify(tagsArray));
        } else if (key === 'image') {
          if (form.image) formData.append('image', form.image);
        } else if (key === 'reviews') {
          return; 
        } else {
          formData.append(key, form[key]);
        }
      });

      if (editing) {
        await productAPI.update(editing, formData);
        toast.success('Product updated');
      } else {
        await productAPI.create(formData);
        toast.success('Product created');
      }
      setModal(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await productAPI.update(id, { isActive: !currentStatus });
      toast.success(currentStatus ? 'Product moved to Hidden' : 'Product is now Live');
      loadProducts();
    } catch { 
      toast.error('Operation failed'); 
    }
  };

  const filtered = products.filter(p => {
    return p.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#080808] text-zinc-200 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Products Management</h1>
            <p className="text-zinc-500 text-sm mt-1">Organize your store inventory and visibility</p>
          </div>
          <button onClick={openCreate} className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all">
            + Add New Product
          </button>
        </div>

        <div className="flex items-center gap-4 mb-8 p-1 bg-zinc-900/50 w-fit rounded-2xl border border-white/5">
          <button 
            onClick={() => { setActiveTab('live'); setPage(1); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'live' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            Live Products
          </button>
          <button 
            onClick={() => { setActiveTab('hidden'); setPage(1); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'hidden' ? 'bg-rose-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            Hidden
          </button>
        </div>

        <div className="relative mb-8 max-w-md">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full px-5 py-3 bg-zinc-900/50 border border-white/5 rounded-2xl text-sm focus:border-white/20 outline-none transition-all text-white"
          />
        </div>

        <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="px-8 py-5 text-xs font-semibold text-zinc-500 tracking-wider">Product</th>
                  <th className="px-8 py-5 text-xs font-semibold text-zinc-500 tracking-wider">Inventory</th>
                  <th className="px-8 py-5 text-xs font-semibold text-zinc-500 tracking-wider">Price</th>
                  <th className="px-8 py-5 text-xs font-semibold text-zinc-500 tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan="4" className="px-8 py-20 text-center text-zinc-600">Loading inventory...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="4" className="px-8 py-20 text-center text-zinc-600 font-medium text-sm">No products found in this list.</td></tr>
                ) : filtered.map(p => (
                  <tr key={p._id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-8 py-5 flex items-center gap-4">
                      <img src={getImageUrl(p.image) || `https://placehold.co/48x48/18181b/22c55e?text=${encodeURIComponent(p.name?.[0] || '?')}`} className="w-12 h-12 rounded-xl object-cover border border-white/5 bg-zinc-800" alt="" />
                      <div>
                        <p className="text-sm font-semibold text-white">{p.name}</p>
                        <p className="text-[11px] text-zinc-500 font-medium">{p.category}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {p.isUnlimited ? (
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-500 font-bold text-xl">∞</span>
                          <span className="text-[10px] text-emerald-500/70 font-bold">Unlimited</span>
                        </div>
                      ) : (
                        <span className={`text-sm font-medium ${p.stock <= 0 ? 'text-rose-500' : 'text-zinc-400'}`}>
                          {p.stock <= 0 ? 'Out of Stock' : `${p.stock} units`}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 font-bold text-white">${p.price}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-4">
                        <button onClick={() => openEdit(p)} className="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Edit</button>
                        <button 
                          onClick={() => handleToggleStatus(p._id, p.isActive)} 
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${p.isActive ? 'bg-zinc-800 text-rose-500 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                        >
                          {p.isActive ? 'Hide Product' : 'Make it Live'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center px-8 py-5 border-t border-white/5 bg-white/[0.01]">
            <p className="text-xs text-zinc-600 font-normal ">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-6">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                className="text-xs font-semibold disabled:opacity-20 hover:text-emerald-500 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button 
                disabled={page === totalPages} 
                onClick={() => setPage(p => p + 1)}
                className="text-xs font-semibold disabled:opacity-20 hover:text-emerald-500 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-white">{editing ? 'Update Product' : 'New Product'}</h2>
                <button onClick={() => setModal(false)} className="text-zinc-500 hover:text-white text-3xl transition-colors">&times;</button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="flex items-center justify-between p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl mb-8">
                  <div>
                    <p className="text-sm font-bold text-emerald-400 font-sans">Unlimited / Manual Inventory</p>
                    <p className="text-[11px] text-zinc-500 font-medium mt-1">
                      Enable this to prevent "Out of Stock" status. Best for services and digital cards.
                    </p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={form.isUnlimited} 
                    onChange={e => setForm(f => ({ ...f, isUnlimited: e.target.checked }))}
                    className="w-6 h-6 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">Product Name *</label>
                    <input required value={form.name} onChange={e => setForm(f=>({...f, name: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">Category *</label>
                    <select value={form.category} onChange={e => setForm(f=>({...f, category: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white font-sans">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">Platform</label>
                    <input value={form.platform} onChange={e => setForm(f=>({...f, platform: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white" placeholder="e.g. Roblox, Steam" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">Price ($) *</label>
                    <input required type="number" step="0.01" value={form.price} onChange={e => setForm(f=>({...f, price: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">Original Price</label>
                    <input type="number" step="0.01" value={form.originalPrice} onChange={e => setForm(f=>({...f, originalPrice: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white" />
                  </div>

                  {!form.isUnlimited && (
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">Stock Count *</label>
                      <input type="number" value={form.stock} onChange={e => setForm(f=>({...f, stock: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white" />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">YouTube URL</label>
                    <input value={form.youtubeUrl} onChange={e => setForm(f=>({...f, youtubeUrl: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white" placeholder="https://youtube.com/watch?v=..." />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">Extra Info</label>
                    <input value={form.extraInfo} onChange={e => setForm(f=>({...f, extraInfo: e.target.value}))} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all text-white" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">Full Description *</label>
                    <textarea required value={form.description} onChange={e => setForm(f=>({...f, description: e.target.value}))} rows={4} className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 outline-none focus:border-white transition-all resize-none text-white font-sans" />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-zinc-500 mb-2 block tracking-wide">Image Asset</label>
                    <input type="file" accept="image/*" onChange={e => setForm(f => ({ ...f, image: e.target.files[0] }))} className="w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-white file:text-black hover:file:bg-zinc-200 cursor-pointer transition-all font-sans" />
                  </div>

                  <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                    <input type="checkbox" id="isFeatured" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 accent-white cursor-pointer" />
                    <label htmlFor="isFeatured" className="text-xs font-semibold text-zinc-400 cursor-pointer font-sans">Mark as Featured</label>
                  </div>
                </div>

                {/* Reviews */}
                {editing && form.reviews && form.reviews.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-white/5">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      Customer Reviews 
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded-full">{form.reviews.length}</span>
                    </h3>
                    
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {form.reviews.map((rev) => (
                        <div key={rev._id} className="p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-emerald-500">★ {rev.rating}</span>
                              <span className="text-[10px] text-zinc-500">{new Date(rev.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed">{rev.comment}</p>
                            <p className="text-[10px] text-zinc-600 mt-2 font-mono">User ID: {rev.user}</p>
                          </div>
                          
                          <button 
                            type="button"
                            onClick={() => handleDeleteReview(rev._id)}
                            className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all text-xs font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-8 border-t border-white/5">
                  <button type="submit" disabled={saving} className="flex-1 bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50">
                    {saving ? 'Processing...' : editing ? 'Update Asset' : 'Create Asset'}
                  </button>
                  <button type="button" onClick={() => setModal(false)} className="px-10 bg-zinc-900 text-zinc-400 font-bold py-4 rounded-xl hover:bg-zinc-800 transition-all font-sans">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}