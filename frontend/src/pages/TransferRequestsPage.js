import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRightLeft, Plus, Check, X, Clock, Package, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

function StatusBadge({ status }) {
  const s = { pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
  return <span className={'px-2.5 py-1 rounded-full text-xs font-medium ' + (s[status] || s.pending)}>{status}</span>;
}

export default function TransferRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [formData, setFormData] = useState({ source_branch_id: '', target_branch_id: '', quantity: 1, reason: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const url = statusFilter ? `${API}/api/transfer-requests?status=${statusFilter}` : `${API}/api/transfer-requests`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      setRequests(data.requests || []);
    } catch { toast.error('Failed to load transfer requests'); }
    setLoading(false);
  }, [statusFilter]);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/branches`, { credentials: 'include' });
      const data = await res.json();
      setBranches(data.branches || []);
    } catch {}
  }, []);

  useEffect(() => { fetchRequests(); fetchBranches(); }, [fetchRequests, fetchBranches]);

  const searchProducts = async (q) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await fetch(`${API}/api/search/products?q=${encodeURIComponent(q)}&limit=10`, { credentials: 'include' });
      const data = await res.json();
      setSearchResults(data.products || []);
    } catch {}
  };

  const checkAvailability = async (product) => {
    setSelectedProduct(product);
    try {
      const res = await fetch(`${API}/api/inventory/cross-branch/${product.id}`, { credentials: 'include' });
      const data = await res.json();
      setAvailability(data);
    } catch { toast.error('Failed to check availability'); }
  };

  const submitRequest = async () => {
    if (!selectedProduct || !formData.source_branch_id || !formData.target_branch_id) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/transfer-requests`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: selectedProduct.id, ...formData })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      toast.success('Transfer request created');
      setShowForm(false);
      setSelectedProduct(null);
      setAvailability(null);
      setFormData({ source_branch_id: '', target_branch_id: '', quantity: 1, reason: '' });
      fetchRequests();
    } catch (e) { toast.error(e.message); }
    setSubmitting(false);
  };

  const handleAction = async (requestId, action) => {
    try {
      const res = await fetch(`${API}/api/transfer-requests/${requestId}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      toast.success(action === 'approve' ? 'Transfer approved & stock updated' : 'Transfer rejected');
      fetchRequests();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="flex items-center justify-center h-64" data-testid="transfers-loading"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="transfer-requests-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="h-7 w-7 text-indigo-600" /> Transfer Requests
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Request and manage product transfers between branches</p>
        </div>
        <Button data-testid="new-transfer-btn" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Transfer Request
        </Button>
      </div>

      {/* New Transfer Request Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="transfer-form-modal">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white mb-4">New Transfer Request</h2>

            {/* Product Search */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Search Product</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input data-testid="transfer-product-search" className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Search by name, SKU, barcode..." value={search} onChange={(e) => searchProducts(e.target.value)} />
                </div>
                {searchResults.length > 0 && !selectedProduct && (
                  <div className="mt-2 border rounded-lg divide-y dark:border-slate-600 dark:divide-slate-600 max-h-48 overflow-y-auto">
                    {searchResults.map(p => (
                      <button key={p.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 flex justify-between" onClick={() => checkAvailability(p)} data-testid={'select-product-' + p.id}>
                        <span className="text-sm text-slate-900 dark:text-white">{p.name}</span>
                        <span className="text-xs text-slate-500">Stock: {p.stock} | {p.sku}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Product & Availability */}
              {selectedProduct && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-slate-900 dark:text-white">{selectedProduct.name}</span>
                    <button onClick={() => { setSelectedProduct(null); setAvailability(null); setSearch(''); }} className="text-red-500 text-xs">Clear</button>
                  </div>
                  {availability && (
                    <div>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">Total stock across all branches: {availability.total_stock_all_branches}</p>
                      <div className="space-y-1">
                        {availability.branches?.map((b, i) => (
                          <div key={i} className="flex justify-between text-xs bg-white dark:bg-slate-700 px-2 py-1.5 rounded">
                            <span className="text-slate-700 dark:text-slate-300">{b.branch_name || 'Unassigned'}</span>
                            <span className={'font-medium ' + (b.stock > 0 ? 'text-green-600' : 'text-red-500')}>Stock: {b.stock}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Source & Target Branch */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">From Branch (Source) *</label>
                  <select data-testid="transfer-source-branch" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.source_branch_id} onChange={(e) => setFormData({ ...formData, source_branch_id: e.target.value })}>
                    <option value="">Select source branch</option>
                    {branches.filter(b => b.is_active !== false).map(b => (
                      <option key={b.id} value={b.id}>{b.name} {availability?.branches?.find(ab => ab.branch_id === b.id) ? '(' + availability.branches.find(ab => ab.branch_id === b.id).stock + ' in stock)' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">To Branch (Target) *</label>
                  <select data-testid="transfer-target-branch" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.target_branch_id} onChange={(e) => setFormData({ ...formData, target_branch_id: e.target.value })}>
                    <option value="">Select target branch</option>
                    {branches.filter(b => b.is_active !== false && b.id !== formData.source_branch_id).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Quantity *</label>
                  <input data-testid="transfer-quantity" type="number" min="1" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Reason</label>
                  <input data-testid="transfer-reason" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Out of stock, customer request..." value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 justify-end">
              <Button variant="outline" onClick={() => { setShowForm(false); setSelectedProduct(null); setAvailability(null); }}>Cancel</Button>
              <Button data-testid="submit-transfer-btn" onClick={submitRequest} disabled={submitting || !selectedProduct}>
                {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ArrowRightLeft className="h-4 w-4 mr-1" />}
                Submit Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} data-testid={'filter-' + (s || 'all')} className={'px-3 py-1.5 text-xs rounded-lg border ' + (statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400')} onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden" data-testid="transfer-requests-list">
        {requests.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">No transfer requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                  <th className="px-4 py-3">Product</th><th className="px-4 py-3">From</th><th className="px-4 py-3">To</th>
                  <th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3">By</th>
                  <th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {requests.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30" data-testid={'request-row-' + r.id}>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{r.product_name}</td>
                    <td className="px-4 py-3 text-slate-500">{r.source_branch_name}</td>
                    <td className="px-4 py-3 text-slate-500">{r.target_branch_name}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{r.quantity}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate">{r.reason || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{r.requested_by_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">{r.created_at?.slice(0, 10)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      {r.status === 'pending' && user?.role !== 'STAFF' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleAction(r.id, 'approve')} className="p-1.5 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 rounded text-green-700" data-testid={'approve-' + r.id}><Check className="h-4 w-4" /></button>
                          <button onClick={() => handleAction(r.id, 'reject')} className="p-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 rounded text-red-700" data-testid={'reject-' + r.id}><X className="h-4 w-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
