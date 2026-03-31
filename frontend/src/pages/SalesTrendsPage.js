import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Clock, Calendar, TrendingUp, Zap, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function SalesTrendsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [view, setView] = useState('daily');
  const [perfData, setPerfData] = useState(null);
  const [rfmData, setRfmData] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [trendsRes, perfRes, rfmRes] = await Promise.all([
        fetch(`${API}/api/analytics/sales-trends?period=${period}`, { credentials: 'include' }),
        fetch(`${API}/api/analytics/product-performance?period=${period}`, { credentials: 'include' }),
        fetch(`${API}/api/analytics/customer-rfm`, { credentials: 'include' }),
      ]);
      setData(await trendsRes.json());
      setPerfData(await perfRes.json());
      setRfmData(await rfmRes.json());
    } catch { toast.error('Failed to load analytics'); }
    setLoading(false);
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) return <div className="flex items-center justify-center h-64" data-testid="trends-loading"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  const ins = data.insights;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-xl text-xs">
        <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value > 100 ? `₹${p.value.toLocaleString('en-IN')}` : p.value}</p>)}
      </div>
    );
  };

  const segmentColors = { champions: '#10B981', loyal: '#3B82F6', at_risk: '#F59E0B', lost: '#EF4444', new: '#8B5CF6' };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="sales-trends-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-blue-600" /> Sales & Performance Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Comprehensive business intelligence</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map(p => (
            <button key={p} data-testid={`trends-period-${p}`} className={`px-3 py-1.5 text-xs rounded-lg border ${period === p ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'}`} onClick={() => setPeriod(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" data-testid="trends-insights">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500">Total Revenue</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">₹{ins.total_revenue?.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500">Total Orders</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{ins.total_orders}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500">Avg Daily Revenue</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">₹{ins.avg_daily_revenue?.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 flex items-center gap-1"><Zap className="h-3 w-3" /> Peak Hour</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{ins.peak_hour}:00</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Peak Day</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{ins.peak_day}</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
        {[['daily', 'Daily Trend'], ['hourly', 'Hourly Pattern'], ['weekday', 'Weekday'], ['performance', 'Product Performance'], ['rfm', 'Customer Segments']].map(([k, l]) => (
          <button key={k} data-testid={`view-${k}`} className={`flex-1 px-3 py-2 text-xs rounded-lg ${view === k ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`} onClick={() => setView(k)}>{l}</button>
        ))}
      </div>

      {/* Charts */}
      {view === 'daily' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="daily-chart">
          <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Daily Revenue & Orders</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={data.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={2} name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === 'hourly' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="hourly-chart">
          <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Hourly Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={v => `${v}:00`} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === 'weekday' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="weekday-chart">
          <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Revenue by Day of Week</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={data.weekday}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {view === 'performance' && perfData && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="top-performers-table">
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-4">Top Performers ({perfData.total_products_sold} products sold)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500 border-b dark:border-slate-700"><th className="pb-2 pr-3">Product</th><th className="pb-2 pr-3 text-right">Qty</th><th className="pb-2 pr-3 text-right">Revenue</th><th className="pb-2 pr-3 text-right">Margin</th><th className="pb-2 pr-3 text-right">Velocity/Day</th><th className="pb-2 text-right">Score</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {perfData.top_performers?.slice(0, 15).map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-2 pr-3 font-medium text-slate-900 dark:text-white">{p.name}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{p.qty_sold}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">₹{p.revenue.toLocaleString('en-IN')}</td>
                      <td className="py-2 pr-3 text-right"><span className={`px-1.5 py-0.5 rounded text-xs ${p.margin_pct >= 20 ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700'}`}>{p.margin_pct}%</span></td>
                      <td className="py-2 pr-3 text-right tabular-nums text-blue-600">{p.velocity_per_day}</td>
                      <td className="py-2 text-right"><div className="inline-flex items-center gap-1"><div className="w-12 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${p.performance_score}%` }} /></div><span className="text-xs tabular-nums">{p.performance_score}</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {perfData.slow_movers?.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-900/50 p-5" data-testid="slow-movers">
              <h3 className="font-heading font-semibold text-amber-700 dark:text-amber-400 mb-4">Slow Movers ({perfData.total_slow_movers} products, not sold in period)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {perfData.slow_movers?.slice(0, 12).map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                    <Package className="h-5 w-5 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">Stock: {p.stock} &middot; Value: ₹{p.value.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'rfm' && rfmData && (
        <div className="space-y-4" data-testid="rfm-analysis">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(rfmData.summary || {}).map(([seg, count]) => (
              <div key={seg} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segmentColors[seg] }} />
                  <span className="text-xs text-slate-500 capitalize">{seg}</span>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{count}</p>
              </div>
            ))}
          </div>
          {Object.entries(rfmData.segments || {}).map(([seg, customers]) => customers.length > 0 && (
            <div key={seg} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-3 capitalize flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segmentColors[seg] }} /> {seg} ({customers.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-slate-500 border-b dark:border-slate-700"><th className="pb-2 pr-3">Customer</th><th className="pb-2 pr-3 text-right">Recency</th><th className="pb-2 pr-3 text-right">Frequency</th><th className="pb-2 text-right">Monetary</th></tr></thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {customers.slice(0, 10).map((c, i) => (
                      <tr key={i}><td className="py-2 pr-3 text-slate-900 dark:text-white">{c.name || c.customer_id}</td><td className="py-2 pr-3 text-right tabular-nums text-slate-500">{c.recency_days}d</td><td className="py-2 pr-3 text-right tabular-nums">{c.frequency}</td><td className="py-2 text-right tabular-nums font-medium text-emerald-600">₹{c.monetary.toLocaleString('en-IN')}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
