import React, { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['game-codes','gift-cards','ebooks','software','subscriptions','other'];
const EMPTY_FORM = { name:'', description:'', shortDescription:'', category:'game-codes', platform:'', region:'Global', price:'', originalPrice:'', image:'', tags:'', isFeatured:false, extraInfo:'', youtubeUrl:'' };
export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({ limit: 100 });
      setProducts(res.data.products);
    } catch (err) { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setForm(EMPTY_FORM); setEditing(null); setModal(true); };
  const openEdit   = (p) => {
    setForm({ ...p, tags: p.tags?.join(', ') || '', price: p.price.toString(), originalPrice: (p.originalPrice||'').toString() });
    setEditing(p._id);
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      if (editing) {
        await productAPI.update(editing, payload);
        toast.success('Product updated!');
      } else {
        await productAPI.create(payload);
        toast.success('Product created!');
      }
      setModal(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deactivate "${name}"?`)) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deactivated');
      loadProducts();
    } catch { toast.error('Delete failed'); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.includes(search.toLowerCase())
  );

  return (
    <div className="page-enter pt-20 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <h1 className="font-display font-bold text-3xl text-white">Products</h1>
          <button onClick={openCreate} className="btn-primary">+ Add Product</button>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="input-field mb-6 max-w-sm"
        />

        {/* Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  {['Product','Category','Price','Stock','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [...Array(6)].map((_,i) => (
                    <tr key={i}>
                      {[...Array(6)].map((_,j) => (
                        <td key={j} className="px-4 py-4"><div className="skeleton h-4 rounded w-24" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.map(p => (
                  <tr key={p._id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image || `https://placehold.co/40x40/1a1a35/6366f1?text=${p.name[0]}`}
                          alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          onError={e => { e.target.src = `https://placehold.co/40x40/1a1a35/6366f1?text=${p.name[0]}`; }}
                        />
                        <div>
                          <p className="text-sm font-medium text-white line-clamp-1 max-w-[200px]">{p.name}</p>
                          {p.platform && <p className="text-xs text-gray-500">{p.platform}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="badge bg-primary-500/10 text-primary-400 border border-primary-500/20 text-xs capitalize">
                        {p.category.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-white font-semibold text-sm">${p.price.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-semibold ${p.stock === 0 ? 'text-red-400' : p.stock <= 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge text-xs ${p.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="text-xs px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors">Edit</button>
                        <button onClick={() => handleDelete(p._id, p.name)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500">No products found</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModal(false)} />
          <div className="relative w-full max-w-2xl bg-surface-800 rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface-800 border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-white">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
  <label className="block text-sm text-gray-400 mb-1">
    📌 Extra Info (يظهر في الـ popup)
  </label>
  <textarea
    value={form.extraInfo}
    onChange={e => setForm(f=>({...f, extraInfo:e.target.value}))}
    rows={3}
    className="input-field resize-none"
    placeholder="Additional information about the product, such as redemption instructions or important notes. This will be shown in a popup on the product page."
  />
</div>

<div>
  <label className="block text-sm text-gray-400 mb-1">
    🎬 YouTube Video URL (optional)
  </label>
  <input
    value={form.youtubeUrl}
    onChange={e => setForm(f=>({...f, youtubeUrl:e.target.value}))}
    className="input-field"
    placeholder="https://www.youtube.com/watch?v=..."
  />
</div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} className="input-field">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Platform</label>
                  <input value={form.platform} onChange={e => setForm(f=>({...f,platform:e.target.value}))} className="input-field" placeholder="e.g. Steam, PlayStation" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Price ($) *</label>
                  <input required type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f=>({...f,price:e.target.value}))} className="input-field" placeholder="19.99" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Original Price ($)</label>
                  <input type="number" step="0.01" min="0" value={form.originalPrice} onChange={e => setForm(f=>({...f,originalPrice:e.target.value}))} className="input-field" placeholder="29.99 (for discount)" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Region</label>
                  <input value={form.region} onChange={e => setForm(f=>({...f,region:e.target.value}))} className="input-field" placeholder="Global, US, EU..." />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Image URL</label>
                  <input value={form.image} onChange={e => setForm(f=>({...f,image:e.target.value}))} className="input-field" placeholder="https://..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Short Description</label>
                  <input value={form.shortDescription} onChange={e => setForm(f=>({...f,shortDescription:e.target.value}))} className="input-field" maxLength={200} placeholder="One-liner description" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Full Description *</label>
                  <textarea required value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} rows={4} className="input-field resize-none" placeholder="Detailed product description..." />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
                  <input value={form.tags} onChange={e => setForm(f=>({...f,tags:e.target.value}))} className="input-field" placeholder="steam, gaming, gift-card" />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => setForm(f=>({...f,isFeatured:e.target.checked}))} className="w-4 h-4 accent-primary-500" />
                  <label htmlFor="featured" className="text-sm text-gray-300">Featured Product</label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="btn-secondary px-6">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
