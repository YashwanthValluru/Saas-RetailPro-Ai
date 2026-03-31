import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Plus, Edit2, Trash2, MapPin, Phone, Users, Package, ArrowRightLeft, BarChart3, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function BranchesPage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBranch, setEditBranch] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', phone: '', manager_name: '', is_main: false });
  const [stats, setStats] = useState({});
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferData, setTransferData] = useState({ source_branch_id: '', target_branch_id: '', product_ids: [] });
  const [branchProducts, setBranchProducts] = useState([]);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/branches`, { credentials: 'include' });
      const data = await res.json();
      setBranches(data.branches || []);
    } catch { toast.error('Failed to load branches'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const loadStats = async (branchId) => {
    try {
      const res = await fetch(`${API}/api/branches/${branchId}/stats`, { credentials: 'include' });
      const data = await res.json();
      setStats(prev => ({ ...prev, [branchId]: data }));
    } catch {}
  };

  const handleSave = async () => {
    try {
      const url = editBranch ? `${API}/api/branches/${editBranch.id}` : `${API}/api/branches`;
      const res = await fetch(url, {
        method: editBranch ? 'PUT' : 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      toast.success(editBranch ? 'Branch updated' : 'Branch created');
      setShowForm(false); setEditBranch(null);
      setForm({ name: '', code: '', address: '', phone: '', manager_name: '', is_main: false });
      fetchBranches();
    } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this branch?')) return;
    try {
      const res = await fetch(`${API}/api/branches/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      toast.success('Branch deleted');
      fetchBranches();
    } catch (e) { toast.error(e.message); }
  };

  const handleTransfer = async () => {
    try {
      const res = await fetch(`${API}/api/branches/transfer-products`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_ids: transferData.product_ids, target_branch_id: transferData.target_branch_id })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      const data = await res.json();
      toast.success(data.message);
      setShowTransfer(false);
      fetchBranches();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="flex items-center justify-center h-64" data-testid="branches-loading"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="branches-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-7 w-7 text-blue-600" /> Branch Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage multiple store locations</p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'OWNER' && (
            <>
              <Button data-testid="transfer-products-btn" variant="outline" onClick={() => setShowTransfer(true)}>
                <ArrowRightLeft className="h-4 w-4 mr-1" /> Transfer Products
              </Button>
              <Button data-testid="add-branch-btn" onClick={() => { setShowForm(true); setEditBranch(null); setForm({ name: '', code: '', address: '', phone: '', manager_name: '', is_main: false }); }}>
                <Plus className="h-4 w-4 mr-1" /> Add Branch
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Branch Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="branch-form-modal">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white mb-4">{editBranch ? 'Edit Branch' : 'New Branch'}</h2>
            <div className="space-y-3">
              <input data-testid="branch-name-input" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Branch Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input data-testid="branch-code-input" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Branch Code (e.g., BR-001)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              <input data-testid="branch-address-input" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              <input data-testid="branch-phone-input" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input data-testid="branch-manager-input" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Manager Name" value={form.manager_name} onChange={e => setForm({ ...form, manager_name: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.is_main} onChange={e => setForm({ ...form, is_main: e.target.checked })} /> Main Branch
              </label>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditBranch(null); }}>Cancel</Button>
              <Button data-testid="save-branch-btn" onClick={handleSave} disabled={!form.name}>{editBranch ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="transfer-modal">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white mb-4">Transfer Products</h2>
            <div className="space-y-3">
              <select data-testid="transfer-target-select" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={transferData.target_branch_id} onChange={e => setTransferData({ ...transferData, target_branch_id: e.target.value })}>
                <option value="">Select Target Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <textarea data-testid="transfer-product-ids" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Paste product IDs (one per line)" rows={4} onChange={e => setTransferData({ ...transferData, product_ids: e.target.value.split('\n').filter(Boolean) })} />
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <Button variant="outline" onClick={() => setShowTransfer(false)}>Cancel</Button>
              <Button data-testid="confirm-transfer-btn" onClick={handleTransfer} disabled={!transferData.target_branch_id || !transferData.product_ids.length}>Transfer</Button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="branches-grid">
        {branches.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-500 dark:text-slate-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">No branches yet</p>
            <p className="text-sm">Create your first branch to manage multiple locations</p>
          </div>
        ) : branches.map(branch => (
          <div key={branch.id} data-testid={`branch-card-${branch.id}`} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-heading font-bold text-slate-900 dark:text-white text-lg">{branch.name}</h3>
                {branch.code && <span className="text-xs font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">{branch.code}</span>}
              </div>
              <div className="flex items-center gap-1">
                {branch.is_main && <span className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">Main</span>}
                <span className={`text-xs px-2 py-0.5 rounded-full ${branch.is_active !== false ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                  {branch.is_active !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              {branch.address && <p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {branch.address}</p>}
              {branch.phone && <p className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {branch.phone}</p>}
              {branch.manager_name && <p className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {branch.manager_name}</p>}
            </div>
            <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{branch.product_count || 0}</p>
                <p className="text-xs text-slate-500">Products</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">{branch.user_count || 0}</p>
                <p className="text-xs text-slate-500">Users</p>
              </div>
              <div className="flex-1 flex justify-end gap-1">
                <Button variant="ghost" size="sm" onClick={() => loadStats(branch.id)} data-testid={`branch-stats-btn-${branch.id}`}>
                  <BarChart3 className="h-4 w-4" />
                </Button>
                {user?.role === 'OWNER' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => { setEditBranch(branch); setForm(branch); setShowForm(true); }} data-testid={`edit-branch-btn-${branch.id}`}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(branch.id)} data-testid={`delete-branch-btn-${branch.id}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            {stats[branch.id] && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm" data-testid={`branch-stats-${branch.id}`}>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-500">Today Revenue:</span> <span className="font-bold text-emerald-600">₹{stats[branch.id].today_revenue?.toLocaleString()}</span></div>
                  <div><span className="text-slate-500">Today Orders:</span> <span className="font-bold">{stats[branch.id].today_orders}</span></div>
                  <div><span className="text-slate-500">Low Stock:</span> <span className="font-bold text-amber-600">{stats[branch.id].low_stock_count}</span></div>
                  <div><span className="text-slate-500">Total Invoices:</span> <span className="font-bold">{stats[branch.id].total_invoices}</span></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
