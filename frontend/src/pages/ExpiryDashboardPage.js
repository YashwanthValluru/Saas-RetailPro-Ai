import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle2, Package, ChevronDown, ChevronRight, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

function StatusBadge({ status }) {
  const styles = {
    expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    critical: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    notice: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    ok: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.ok}`}>{status}</span>;
}

export default function ExpiryDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expired');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/inventory/expiry-dashboard`, { credentials: 'include' });
      const d = await res.json();
      setData(d);
    } catch { toast.error('Failed to load expiry data'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) return <div className="flex items-center justify-center h-64" data-testid="expiry-loading"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  const s = data.summary;
  const tabs = [
    { key: 'expired', label: 'Expired', count: s.total_expired, icon: ShieldAlert, color: 'text-red-600' },
    { key: 'critical', label: 'Critical (30d)', count: s.total_critical, icon: AlertTriangle, color: 'text-orange-600' },
    { key: 'warning', label: 'Warning (90d)', count: s.total_warning, icon: Clock, color: 'text-yellow-600' },
    { key: 'notice', label: 'Notice (180d)', count: s.total_notice, icon: Package, color: 'text-blue-600' },
  ];

  const activeProducts = data[activeTab] || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="expiry-dashboard-page">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="h-7 w-7 text-amber-500" /> Batch Expiry Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor and manage product expiration dates</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="expiry-summary-cards">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-sm text-slate-500">Tracked Products</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{s.total_tracked}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-900/50 p-5">
          <p className="text-sm text-red-600 dark:text-red-400">Expired</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300 tabular-nums">{s.total_expired}</p>
          <p className="text-xs text-red-500 mt-1">Value: ₹{s.expired_value?.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-900/50 p-5">
          <p className="text-sm text-orange-600 dark:text-orange-400">Critical (30 days)</p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 tabular-nums">{s.total_critical}</p>
          <p className="text-xs text-orange-500 mt-1">At risk: ₹{s.at_risk_value?.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-900/50 p-5">
          <p className="text-sm text-green-600 dark:text-green-400">Safe (180+ days)</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300 tabular-nums">{s.total_ok}</p>
        </div>
      </div>

      {/* Category Breakdown Chart */}
      {data.by_category?.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="expiry-category-chart">
          <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Expiring by Category</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={data.by_category.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v, name) => name === 'value' ? `₹${v.toLocaleString('en-IN')}` : v} />
                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Products" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
        {tabs.map(({ key, label, count, icon: Icon, color }) => (
          <button key={key} data-testid={`expiry-tab-${key}`} className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === key ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`} onClick={() => setActiveTab(key)}>
            <Icon className={`h-4 w-4 ${activeTab === key ? 'text-white' : color}`} />
            {label} <span className="tabular-nums font-medium">({count})</span>
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden" data-testid="expiry-product-list">
        {activeProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-400" />
            <p>No products in this category</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                  <th className="px-4 py-3">Product</th><th className="px-4 py-3">Batch</th><th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3">Expiry Date</th><th className="px-4 py-3 text-right">Days Left</th><th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {activeProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.batch_number || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{p.category || '-'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.stock}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.expiry_date?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">{p.days_until_expiry || 0}d</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
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
