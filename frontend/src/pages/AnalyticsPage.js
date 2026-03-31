import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, Users, Package, ShoppingCart, DollarSign,
  Zap, AlertTriangle, Download, RefreshCw, Clock, BarChart3, PieChart as PieIcon,
  Eye, Server, Shield, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';

const API = '/api';
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function KPICard({ title, value, prevValue, prefix = '', suffix = '', icon: Icon, color = 'blue', trend }) {
  const change = trend !== undefined ? trend : (prevValue !== undefined ? ((value - prevValue) / Math.max(prevValue, 1) * 100) : null);
  const isPositive = change > 0;
  const isNegative = change < 0;
  const colorMap = { blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' };

  return (
    <Card className="hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</span>
          <div className={`p-2 rounded-lg ${colorMap[color]}`}><Icon className="h-4 w-4" /></div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</span>
          {change !== null && (
            <div className={`flex items-center gap-0.5 text-xs font-medium mb-1 ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-slate-400'}`}>
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : isNegative ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, description, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {Icon && <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>}
      <div>
        <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white">{title}</h2>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30d');
  const [overview, setOverview] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [customerInsights, setCustomerInsights] = useState(null);
  const [usageHeatmap, setUsageHeatmap] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [platformData, setPlatformData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const isPlatformAdmin = user?.is_platform_admin;
  const isAdmin = user?.is_admin;
  const isProductSide = isPlatformAdmin || isAdmin;

  // Set initial tab based on user type
  useEffect(() => {
    if (activeTab === null) {
      setActiveTab(isProductSide ? 'platform' : 'overview');
    }
  }, [isProductSide, activeTab]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      if (isProductSide) {
        // Platform admin: fetch platform overview + admin-only analytics
        const requests = [
          axios.get(`${API}/analytics/platform/overview`, { params: { period }, withCredentials: true }),
          axios.get(`${API}/analytics/owner/customer-insights`, { params: { period }, withCredentials: true }),
          axios.get(`${API}/analytics/owner/usage-heatmap`, { params: { period }, withCredentials: true }),
        ];
        const [pd, ci, uh] = await Promise.all(requests);
        setPlatformData(pd.data);
        setCustomerInsights(ci.data);
        setUsageHeatmap(uh.data);
      } else {
        // Owner/Manager: only overview, revenue, products
        const [ov, rt, tp] = await Promise.all([
          axios.get(`${API}/analytics/owner/overview`, { params: { period }, withCredentials: true }),
          axios.get(`${API}/analytics/owner/revenue-trend`, { params: { period }, withCredentials: true }),
          axios.get(`${API}/analytics/owner/top-products`, { params: { period }, withCredentials: true }),
        ]);
        setOverview(ov.data);
        setRevenueTrend(rt.data);
        setTopProducts(tp.data);
      }
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [period, isProductSide]);

  const fetchRealtime = useCallback(async () => {
    if (!isProductSide) return; // Only admin/platform admin gets realtime
    try {
      const { data } = await axios.get(`${API}/analytics/realtime`, { withCredentials: true });
      setRealtime(data);
    } catch {}
  }, [isProductSide]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);
  useEffect(() => {
    if (isProductSide) {
      fetchRealtime();
      const interval = setInterval(fetchRealtime, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchRealtime, isProductSide]);

  const handleExport = async (type) => {
    try {
      const response = await axios.get(`${API}/analytics/export`, { params: { type, period }, withCredentials: true, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${period}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const kpis = overview?.kpis || {};

  // Tabs based on user type
  const tabs = isProductSide
    ? [
        { id: 'platform', label: 'Platform Overview', icon: Server },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'usage', label: 'API & Usage', icon: Activity },
        { id: 'realtime', label: 'Real-Time', icon: Zap },
      ]
    : [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'revenue', label: 'Revenue', icon: DollarSign },
        { id: 'products', label: 'Products', icon: Package },
      ];

  if (loading && !overview && !platformData) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          <span className="text-slate-500 font-heading">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
            {isProductSide ? 'Platform Analytics' : 'Business Analytics'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isProductSide ? 'Platform-wide insights, monitoring & admin controls' : 'Business performance insights'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32 dark:bg-slate-800 dark:border-slate-600"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} className="dark:border-slate-600 dark:text-slate-300"><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          {/* CSV Export — platform admin only */}
          {isProductSide && (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => handleExport('revenue')} className="dark:border-slate-600 dark:text-slate-300"><Download className="h-4 w-4 mr-1" />Revenue</Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('api_usage')} className="dark:border-slate-600 dark:text-slate-300"><Download className="h-4 w-4 mr-1" />Usage</Button>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Strip — platform admin only */}
      {isProductSide && realtime && (
        <div className="flex items-center gap-6 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /><span className="text-xs font-medium text-slate-500 dark:text-slate-400">LIVE</span></div>
          <div className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">{realtime.requests_per_minute}</span> req/min</div>
          <div className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">{realtime.avg_response_ms}ms</span> avg latency</div>
          <div className="text-xs text-slate-600 dark:text-slate-300">Errors: <span className={`font-semibold ${realtime.error_rate > 5 ? 'text-red-600' : 'text-green-600'}`}>{realtime.error_rate}%</span></div>
          <div className="text-xs text-slate-600 dark:text-slate-300"><span className="font-semibold">{realtime.total_requests}</span> calls (5min)</div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <tab.icon className="h-3.5 w-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {/* ─── OWNER/MANAGER: OVERVIEW TAB ─── */}
      {activeTab === 'overview' && !isProductSide && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KPICard title="Revenue" value={kpis.total_revenue || 0} prevValue={kpis.prev_revenue} prefix="₹" icon={DollarSign} color="green" />
            <KPICard title="Orders" value={kpis.total_invoices || 0} prevValue={kpis.prev_invoices} icon={ShoppingCart} color="blue" />
            <KPICard title="Avg Order" value={kpis.avg_order_value || 0} prevValue={kpis.prev_aov} prefix="₹" icon={TrendingUp} color="purple" />
            <KPICard title="Products" value={kpis.total_products || 0} icon={Package} color="cyan" />
            <KPICard title="Customers" value={kpis.total_customers || 0} icon={Users} color="amber" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-full"><AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" /></div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpis.low_stock || 0}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Low Stock Items</p>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-full"><Users className="h-5 w-5 text-green-600 dark:text-green-400" /></div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpis.new_customers || 0}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">New Customers</p>
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-full"><Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" /></div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpis.avg_response_ms || 0}<span className="text-sm font-normal">ms</span></p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Avg Response Time</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Trend Chart */}
          {revenueTrend?.trend && (
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-heading dark:text-white">Revenue Trend</CardTitle>
                <CardDescription className="dark:text-slate-400">Daily revenue over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueTrend.trend.slice(-30)}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── OWNER/MANAGER: REVENUE TAB ─── */}
      {activeTab === 'revenue' && !isProductSide && (
        <div className="space-y-6">
          <SectionHeader title="Revenue Analytics" description="Detailed revenue breakdown and trends" icon={DollarSign} />
          <div className="grid grid-cols-4 gap-4">
            <KPICard title="Total Revenue" value={kpis.total_revenue || 0} prefix="₹" icon={DollarSign} color="green" trend={kpis.revenue_change} />
            <KPICard title="Total Orders" value={kpis.total_invoices || 0} icon={ShoppingCart} color="blue" trend={kpis.invoice_change} />
            <KPICard title="Avg Order Value" value={kpis.avg_order_value || 0} prefix="₹" icon={TrendingUp} color="purple" trend={kpis.aov_change} />
            <KPICard title="Total Discounts" value={kpis.total_discount || 0} prefix="₹" icon={DollarSign} color="red" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Revenue + Orders combo chart */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white">Revenue & Order Volume</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueTrend?.trend?.slice(-30) || []}>
                    <defs>
                      <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10B981" fill="url(#colorRev2)" name="Revenue (₹)" />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} dot={false} name="Orders" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by day of week */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white">Revenue by Day</CardTitle></CardHeader>
              <CardContent>
                {revenueTrend?.trend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueTrend.trend.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                      <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Revenue" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-slate-400 py-12">No revenue data available yet</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── OWNER/MANAGER: PRODUCTS TAB ─── */}
      {activeTab === 'products' && !isProductSide && (
        <div className="space-y-6">
          <SectionHeader title="Product Analytics" description="Top performers and product insights" icon={Package} />
          <div className="grid grid-cols-2 gap-6">
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white">Top Products by Revenue</CardTitle></CardHeader>
              <CardContent>
                {topProducts?.by_revenue?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProducts.by_revenue} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                      <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-slate-400 py-12">No sales data yet. Make your first sale!</p>}
              </CardContent>
            </Card>

            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white">Top Products by Quantity</CardTitle></CardHeader>
              <CardContent>
                {topProducts?.by_quantity?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProducts.by_quantity} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="qty" fill="#10B981" radius={[0, 4, 4, 0]} name="Units Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-slate-400 py-12">No sales data yet</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
           PLATFORM ADMIN TABS BELOW
         ═══════════════════════════════════════════════════════════ */}

      {/* ─── PLATFORM ADMIN: PLATFORM OVERVIEW TAB ─── */}
      {isProductSide && activeTab === 'platform' && platformData && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <KPICard title="Total Tenants" value={platformData.kpis.total_tenants} icon={Server} color="blue" />
            <KPICard title="Active Tenants" value={platformData.kpis.active_tenants} icon={Activity} color="green" />
            <KPICard title="Total Users" value={platformData.kpis.total_users} icon={Users} color="purple" />
            <KPICard title="Platform Revenue" value={platformData.kpis.total_revenue} prefix="₹" icon={DollarSign} color="green" />
            <KPICard title="System Error Rate" value={platformData.kpis.error_rate} suffix="%" icon={AlertTriangle} color={platformData.kpis.error_rate > 5 ? 'red' : 'green'} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* API Trend */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white">Platform API Traffic</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={platformData.daily_api_trend || []}>
                    <defs>
                      <linearGradient id="colorPlatform" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="calls" stroke="#8B5CF6" fill="url(#colorPlatform)" name="API Calls" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Tenants */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white">Top Tenants by Usage</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-slate-700">
                      <TableHead className="dark:text-slate-400">Tenant</TableHead>
                      <TableHead className="text-right dark:text-slate-400">API Calls</TableHead>
                      <TableHead className="text-right dark:text-slate-400">Revenue</TableHead>
                      <TableHead className="text-right dark:text-slate-400">Avg Latency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(platformData.top_tenants || []).map((t, i) => (
                      <TableRow key={i} className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-white">{t.tenant_name || 'Unknown'}</TableCell>
                        <TableCell className="text-right dark:text-slate-300">{t.calls?.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">₹{t.revenue?.toLocaleString()}</TableCell>
                        <TableCell className="text-right"><Badge variant={t.avg_ms < 50 ? 'default' : 'secondary'}>{t.avg_ms}ms</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── PLATFORM ADMIN: CUSTOMERS TAB ─── */}
      {isProductSide && activeTab === 'customers' && (
        <div className="space-y-6">
          <SectionHeader title="Customer Analytics" description="Platform-wide customer behavior and engagement insights" icon={Users} />
          <div className="grid grid-cols-4 gap-4">
            <KPICard title="Total Customers" value={customerInsights?.total_unique_customers || 0} icon={Users} color="blue" />
            <KPICard title="1 Order" value={customerInsights?.frequency_distribution?.['1_order'] || 0} icon={Users} color="amber" />
            <KPICard title="2-5 Orders" value={customerInsights?.frequency_distribution?.['2_5_orders'] || 0} icon={Users} color="green" />
            <KPICard title="10+ Orders" value={customerInsights?.frequency_distribution?.['10_plus'] || 0} icon={Users} color="purple" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Customer Frequency Distribution */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white">Purchase Frequency</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '1 Order', value: customerInsights?.frequency_distribution?.['1_order'] || 0 },
                        { name: '2-5 Orders', value: customerInsights?.frequency_distribution?.['2_5_orders'] || 0 },
                        { name: '6-10 Orders', value: customerInsights?.frequency_distribution?.['6_10_orders'] || 0 },
                        { name: '10+ Orders', value: customerInsights?.frequency_distribution?.['10_plus'] || 0 },
                      ].filter(d => d.value > 0)}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} label>
                      {[0, 1, 2, 3].map(i => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Customers Table */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white">Top Customers</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-slate-700">
                      <TableHead className="dark:text-slate-400">Customer</TableHead>
                      <TableHead className="text-right dark:text-slate-400">Orders</TableHead>
                      <TableHead className="text-right dark:text-slate-400">Revenue</TableHead>
                      <TableHead className="text-right dark:text-slate-400">Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(customerInsights?.top_customers || []).map((c, i) => (
                      <TableRow key={i} className="dark:border-slate-700">
                        <TableCell className="font-medium dark:text-white">{c.name}</TableCell>
                        <TableCell className="text-right dark:text-slate-300">{c.orders}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">₹{c.total.toLocaleString()}</TableCell>
                        <TableCell className="text-right dark:text-slate-300">₹{c.avg_order}</TableCell>
                      </TableRow>
                    ))}
                    {(!customerInsights?.top_customers?.length) && (
                      <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">No customer data yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Category */}
          {customerInsights?.revenue_by_category?.length > 0 && (
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white">Revenue by Category</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={customerInsights.revenue_by_category} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={true}>
                      {customerInsights.revenue_by_category.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── PLATFORM ADMIN: API & USAGE TAB ─── */}
      {isProductSide && activeTab === 'usage' && (
        <div className="space-y-6">
          <SectionHeader title="API Usage & Performance" description="Platform-wide system usage patterns and performance" icon={Activity} />
          <div className="grid grid-cols-4 gap-4">
            <KPICard title="Total API Calls" value={usageHeatmap?.total_calls || 0} icon={Activity} color="blue" />
            <KPICard title="Error Rate" value={usageHeatmap?.error_rate || 0} suffix="%" icon={AlertTriangle} color={usageHeatmap?.error_rate > 5 ? 'red' : 'green'} />
            <KPICard title="Error Calls" value={usageHeatmap?.error_calls || 0} icon={Shield} color="red" />
            <KPICard title="Total Tenants" value={platformData?.kpis?.total_tenants || 0} icon={Server} color="green" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Hourly Distribution */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white">Usage by Hour of Day</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={usageHeatmap?.hourly_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} label={{ value: 'Hour (UTC)', position: 'insideBottom', offset: -5 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="calls" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="API Calls" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feature Breakdown */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white">Usage by Feature</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-slate-700">
                      <TableHead className="dark:text-slate-400">Feature</TableHead>
                      <TableHead className="text-right dark:text-slate-400">Calls</TableHead>
                      <TableHead className="text-right dark:text-slate-400">Avg Latency</TableHead>
                      <TableHead className="dark:text-slate-400">Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(usageHeatmap?.feature_breakdown || []).map((f, i) => {
                      const maxCalls = Math.max(...(usageHeatmap?.feature_breakdown || []).map(x => x.calls), 1);
                      return (
                        <TableRow key={i} className="dark:border-slate-700">
                          <TableCell className="font-medium dark:text-white capitalize">{f.name}</TableCell>
                          <TableCell className="text-right dark:text-slate-300">{f.calls.toLocaleString()}</TableCell>
                          <TableCell className="text-right"><Badge variant={f.avg_ms < 50 ? 'default' : f.avg_ms < 200 ? 'secondary' : 'destructive'}>{f.avg_ms}ms</Badge></TableCell>
                          <TableCell><div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(f.calls / maxCalls) * 100}%` }} /></div></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ─── PLATFORM ADMIN: REAL-TIME TAB ─── */}
      {isProductSide && activeTab === 'realtime' && (
        <div className="space-y-6">
          <SectionHeader title="Real-Time Monitoring" description="Live system metrics — auto-refreshes every 10 seconds" icon={Zap} />
          <div className="grid grid-cols-4 gap-4">
            <KPICard title="Requests/min" value={realtime?.requests_per_minute || 0} icon={Zap} color="blue" />
            <KPICard title="Avg Latency" value={realtime?.avg_response_ms || 0} suffix="ms" icon={Clock} color={realtime?.avg_response_ms > 200 ? 'red' : 'green'} />
            <KPICard title="Error Rate" value={realtime?.error_rate || 0} suffix="%" icon={AlertTriangle} color={realtime?.error_rate > 5 ? 'red' : 'green'} />
            <KPICard title="5min Requests" value={realtime?.total_requests || 0} icon={Activity} color="purple" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Top Endpoints */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />Active Endpoints</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-slate-700">
                      <TableHead className="dark:text-slate-400">Endpoint</TableHead>
                      <TableHead className="text-right dark:text-slate-400">Calls (5min)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(realtime?.top_endpoints || []).map((ep, i) => (
                      <TableRow key={i} className="dark:border-slate-700">
                        <TableCell className="font-mono text-xs dark:text-white">{ep.endpoint}</TableCell>
                        <TableCell className="text-right"><Badge>{ep.count}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent Requests Log */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <CardHeader className="pb-2"><CardTitle className="text-base font-heading dark:text-white flex items-center gap-2"><Eye className="h-4 w-4" />Live Request Log</CardTitle></CardHeader>
              <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-slate-700">
                      <TableHead className="dark:text-slate-400">Method</TableHead>
                      <TableHead className="dark:text-slate-400">Endpoint</TableHead>
                      <TableHead className="text-right dark:text-slate-400">Status</TableHead>
                      <TableHead className="text-right dark:text-slate-400">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(realtime?.recent_requests || []).map((req, i) => (
                      <TableRow key={i} className="dark:border-slate-700">
                        <TableCell><Badge variant={req.method === 'GET' ? 'secondary' : 'default'} className="text-[10px]">{req.method}</Badge></TableCell>
                        <TableCell className="font-mono text-xs dark:text-white truncate max-w-[200px]">{req.endpoint}</TableCell>
                        <TableCell className="text-right"><Badge variant={req.status_code < 400 ? 'default' : 'destructive'}>{req.status_code}</Badge></TableCell>
                        <TableCell className="text-right text-xs dark:text-slate-300">{req.duration_ms}ms</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
