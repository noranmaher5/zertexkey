import React, { useState, useEffect } from 'react';
import { productAPI, codeAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminCodes() {
  const [products, setProducts]   = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [codes, setCodes]         = useState([]);
  const [stats, setStats]         = useState([]);
  const [codesText, setCodesText] = useState('');
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab]             = useState('upload');

  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedProduct && tab === 'view') loadCodes();
  }, [selectedProduct, tab]);

  const loadProducts = async () => {
    const res = await productAPI.getAll({ limit: 200 });
    setProducts(res.data.products);
    if (res.data.products.length) setSelectedProduct(res.data.products[0]._id);
  };

  const loadStats = async () => {
    try {
      const res = await codeAPI.getStats();
      setStats(res.data.stats);
    } catch {}
  };

  const loadCodes = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const res = await codeAPI.getByProduct(selectedProduct, { limit: 200 });
      setCodes(res.data.codes);
    } catch { toast.error('Failed to load codes'); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const lines = codesText.split('\n').map(c => c.trim()).filter(Boolean);
    if (!lines.length) return toast.error('Please enter at least one code');
    if (!selectedProduct) return toast.error('Please select a product');
    setUploading(true);
    try {
      const res = await codeAPI.addBulk({ productId: selectedProduct, codes: lines });
      toast.success(res.data.message);
      setCodesText('');
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this code?')) return;
    try {
      await codeAPI.delete(id);
      toast.success('Code deleted');
      loadCodes();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCodesText(ev.target.result);
    reader.readAsText(file);
  };

  return (
    <div className="page-enter pt-20 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display font-bold text-3xl text-white mb-8">Digital Codes</h1>

        {/* Stats Overview */}
        {stats.length > 0 && (
          <div className="glass rounded-2xl p-5 mb-6">
            <h2 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Stock Overview</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {stats.map(s => (
                <div key={s._id} className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm flex-1 truncate">{s.product?.name}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-400">{s.available} avail</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-gray-400">{s.total} total</span>
                  </div>
                  <div className="w-24 h-1.5 bg-surface-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-accent rounded-full transition-all"
                      style={{ width: `${s.total ? (s.available / s.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 glass rounded-xl p-1 mb-6 w-fit">
          {[['upload','Upload Codes'],['view','View Codes']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab===id ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Product Selector */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Select Product</label>
          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            className="input-field max-w-sm"
          >
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name} (stock: {p.stock})</option>
            ))}
          </select>
        </div>

        {tab === 'upload' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display font-semibold text-white mb-5">Bulk Upload Codes</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">Codes (one per line)</label>
                    <label className="text-xs text-primary-400 cursor-pointer hover:text-primary-300">
                      Upload .txt file
                      <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  <textarea
                    value={codesText}
                    onChange={e => setCodesText(e.target.value)}
                    rows={12}
                    placeholder={'CODE-XXXX-YYYY-ZZZZ\nCODE-AAAA-BBBB-CCCC\nCODE-1234-5678-9012'}
                    className="input-field font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    {codesText.split('\n').filter(c => c.trim()).length} codes detected
                  </p>
                </div>
                <button type="submit" disabled={uploading} className="btn-primary w-full justify-center">
                  {uploading ? 'Uploading...' : 'Upload Codes'}
                </button>
              </form>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="font-display font-semibold text-white mb-4">Tips</h2>
              <div className="space-y-4 text-sm text-gray-400">
                <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-white font-medium mb-1">📄 File Format</p>
                  <p>Upload a plain .txt file with one code per line. Or paste codes directly into the text area.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-white font-medium mb-1">🔄 Duplicates</p>
                  <p>Duplicate codes are automatically skipped. You'll be told how many were added vs skipped.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-white font-medium mb-1">⚡ Auto Stock</p>
                  <p>Product stock count updates automatically after each upload.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-white font-medium mb-1">🔒 Security</p>
                  <p>Codes are stored encrypted and only revealed to users after successful payment.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'view' && (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <p className="text-sm text-gray-400">{codes.length} codes loaded</p>
              <button onClick={loadCodes} disabled={loading} className="btn-secondary text-xs py-1.5 px-3">
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Code', 'Status', 'Used By', 'Used At', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {codes.map(code => (
                    <tr key={code._id} className="hover:bg-white/2">
                      <td className="px-4 py-3 font-mono text-sm text-gray-300">{code.code}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${code.isUsed ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                          {code.isUsed ? 'Used' : 'Available'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{code.usedBy?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {code.usedAt ? new Date(code.usedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {!code.isUsed && (
                          <button onClick={() => handleDelete(code._id)} className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && codes.length === 0 && (
                <div className="text-center py-10 text-gray-500">No codes found for this product</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
