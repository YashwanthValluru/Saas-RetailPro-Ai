import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, BarChart3, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function ProfitDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [tab, setTab] = useState('overview');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reports/profit-dashboard?period=${period}`, { credentials: 'include' });
      const d = await res.json();
      setData(d);
    } catch { toast.error('Failed to load profit data'); }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) return <div className="flex items-center justify-center h-64" data-testid="profit-loading"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  const s = data.summary;

  const StatCard = ({ label, value, prefix = '', change, icon: Icon, color }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white tabular-nums">{prefix}{typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : value}</p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {change >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(change)}% vs prev period
        </div>
      )}
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-xl text-xs">
        <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: ₹{p.value?.toLocaleString('en-IN')}</p>)}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="profit-dashboard-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-emerald-600" /> Profit Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Advanced profit margin analytics</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '365d'].map(p => (
            <button key={p} data-testid={`period-${p}`} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${period === p ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'}`} onClick={() => setPeriod(p)}>
              {p === '365d' ? '1Y' : p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="profit-kpi-cards">
        <StatCard label="Total Revenue" value={s.total_revenue} prefix="₹" change={s.revenue_change} icon={DollarSign} color="text-blue-600" />
        <StatCard label="Total Cost" value={s.total_cost} prefix="₹" icon={Minus} color="text-slate-500" />
        <StatCard label="Net Profit" value={s.total_profit} prefix="₹" change={s.profit_change} icon={s.total_profit >= 0 ? TrendingUp : TrendingDown} color={s.total_profit >= 0 ? 'text-emerald-600' : 'text-red-500'} />
        <StatCard label="Profit Margin" value={`${s.overall_margin}%`} icon={BarChart3} color="text-violet-600" />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
        {[['overview', 'Trend'], ['products', 'Products'], ['categories', 'Categories']].map(([key, label]) => (
          <button key={key} data-testid={`tab-${key}`} className={`flex-1 px-4 py-2 text-sm rounded-lg transition-colors ${tab === key ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Trend Chart */}
      {tab === 'overview' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="profit-trend-chart">
          <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Profit Trend</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={data.daily_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={false} name="Revenue" />
                <Line type="monotone" dataKey="cost" stroke="#EF4444" strokeWidth={1.5} dot={false} name="Cost" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={false} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Product Margins */}
      {tab === 'products' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="top-products-table">
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Top Products by Profit</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b dark:border-slate-700">
                    <th className="pb-2 pr-4">Product</th><th className="pb-2 pr-4">Category</th><th className="pb-2 pr-4 text-right">Revenue</th>
                    <th className="pb-2 pr-4 text-right">Cost</th><th className="pb-2 pr-4 text-right">Profit</th><th className="pb-2 text-right">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {data.top_products.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-white">{p.name}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{p.category}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums">₹{p.revenue.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-red-500">₹{p.cost.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 pr-4 text-right tabular-nums text-emerald-600 font-medium">₹{p.profit.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 text-right"><span className={`px-2 py-0.5 rounded text-xs font-medium ${p.margin_pct >= 30 ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : p.margin_pct >= 15 ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{p.margin_pct}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {data.bottom_products.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/50 p-5" data-testid="bottom-products-table">
              <h3 className="font-heading font-semibold text-red-600 dark:text-red-400 mb-4">Low Margin Products</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-slate-500 border-b dark:border-slate-700"><th className="pb-2 pr-4">Product</th><th className="pb-2 pr-4 text-right">Revenue</th><th className="pb-2 pr-4 text-right">Profit</th><th className="pb-2 text-right">Margin</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {data.bottom_products.map((p, i) => (
                      <tr key={i}><td className="py-2 pr-4 text-slate-900 dark:text-white">{p.name}</td><td className="py-2 pr-4 text-right tabular-nums">₹{p.revenue.toLocaleString('en-IN')}</td><td className="py-2 pr-4 text-right tabular-nums text-red-500">₹{p.profit.toLocaleString('en-IN')}</td><td className="py-2 text-right"><span className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">{p.margin_pct}%</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categories */}
      {tab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="category-pie-chart">
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Revenue by Category</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={data.categories.slice(0, 8)} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ category, revenue_share }) => `${category} (${revenue_share}%)`} labelLine={false}>
                    {data.categories.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="category-margin-chart">
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Margin by Category</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={data.categories.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="margin_pct" fill="#10B981" radius={[0, 4, 4, 0]} name="Margin %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
