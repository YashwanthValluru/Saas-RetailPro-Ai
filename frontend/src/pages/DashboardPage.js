import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, TrendingUp, AlertTriangle, IndianRupee, FileText, UserCheck, Monitor, Smartphone, EyeOff, Brain, RefreshCw, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';

const API = '/api';

const StatCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
  const colors = { blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30', green: 'text-green-600 bg-green-50 dark:bg-green-900/30', amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30', red: 'text-red-600 bg-red-50 dark:bg-red-900/30' };
  return (
    <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow duration-150">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
            {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-md ${colors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(null);
  const [pulseLoading, setPulseLoading] = useState(false);
  const [pulseExpanded, setPulseExpanded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`${API}/reports/dashboard`, { withCredentials: true });
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    fetchPulse();
  }, []);

  const fetchPulse = async () => {
    setPulseLoading(true);
    try {
      const { data } = await axios.get(`${API}/pulse/today`, { withCredentials: true });
      setPulse(data);
    } catch {} finally { setPulseLoading(false); }
  };

  const regeneratePulse = async () => {
    setPulseLoading(true);
    try {
      const { data } = await axios.post(`${API}/pulse/generate`, {}, { withCredentials: true });
      setPulse(data);
    } catch {} finally { setPulseLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-500 dark:text-slate-400">Loading dashboard...</div></div>;

  const revenueHidden = stats?.revenue_hidden;

  return (
    <div data-testid="dashboard-page" className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* AI Business Pulse */}
      {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
        <div className="col-span-full">
          <Card className="border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-slate-900 dark:text-white">AI Business Pulse</h3>
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px]">
                        <Sparkles className="h-2.5 w-2.5 mr-0.5" /> AI
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Your daily business briefing</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={regeneratePulse} disabled={pulseLoading} className="h-7 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    <RefreshCw className={`h-3 w-3 mr-1 ${pulseLoading ? 'animate-spin' : ''}`} /> Refresh
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPulseExpanded(!pulseExpanded)} className="h-7 text-xs dark:text-slate-300">
                    {pulseExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {pulseLoading && !pulse ? (
                <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                  Generating your daily briefing...
                </div>
              ) : pulse?.ai_message ? (
                <div className="mt-3">
                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    {pulseExpanded ? pulse.ai_message : pulse.ai_message.slice(0, 200) + (pulse.ai_message.length > 200 ? '...' : '')}
                  </p>
                  {pulseExpanded && pulse.data && (
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2.5 text-center">
                        <p className="text-lg font-bold text-green-600">₹{pulse.data.yesterday_revenue?.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">Yesterday Revenue</p>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2.5 text-center">
                        <p className="text-lg font-bold text-blue-600">{pulse.data.yesterday_orders}</p>
                        <p className="text-[10px] text-slate-500">Orders</p>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2.5 text-center">
                        <p className={`text-lg font-bold ${pulse.data.revenue_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pulse.data.revenue_change >= 0 ? '+' : ''}{pulse.data.revenue_change}%
                        </p>
                        <p className="text-[10px] text-slate-500">vs Last Week</p>
                      </div>
                      <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2.5 text-center">
                        <p className="text-lg font-bold text-amber-600">{pulse.data.low_stock_count}</p>
                        <p className="text-[10px] text-slate-500">Low Stock Items</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Click Refresh to generate today's business briefing.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
        {revenueHidden ? (
          <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest font-medium text-slate-500 dark:text-slate-400 mb-1">Today's Revenue</p>
                  <div className="flex items-center gap-2 mt-1">
                    <EyeOff className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-400 italic">Permission required</span>
                  </div>
                </div>
                <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-700">
                  <IndianRupee className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <StatCard icon={IndianRupee} label="Today's Revenue" value={`₹${stats?.today_revenue?.toFixed(2) || '0.00'}`} sub={`${stats?.today_invoices || 0} invoices`} color="green" />
        )}
        <StatCard icon={Package} label="Total Products" value={stats?.total_products || 0} color="blue" />
        <StatCard icon={ShoppingCart} label="Total Invoices" value={stats?.total_invoices || 0} color="blue" />
        <StatCard icon={AlertTriangle} label="Low Stock Alerts" value={stats?.low_stock_count || 0} sub={stats?.low_stock_count > 0 ? 'Needs attention' : 'All good'} color={stats?.low_stock_count > 0 ? 'red' : 'green'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {revenueHidden ? (
          <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2 dark:text-white">
                <TrendingUp className="h-5 w-5 text-slate-400" />
                Revenue (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <EyeOff className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Revenue data is restricted</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Contact your store owner for access</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2 dark:text-white">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Revenue (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.revenue_by_day || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
                    <Tooltip
                      contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: 13 }}
                      formatter={(value) => [`₹${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {revenueHidden ? (
          <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2 dark:text-white">
                <FileText className="h-5 w-5 text-slate-400" />
                Recent Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <EyeOff className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">Invoice details are restricted</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2 dark:text-white">
                <FileText className="h-5 w-5 text-blue-600" />
                Recent Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.recent_invoices?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_invoices.map((inv, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                      <div className="flex items-center gap-2">
                        {inv.device_source === 'mobile' ? <Smartphone className="h-3.5 w-3.5 text-slate-400" /> : <Monitor className="h-3.5 w-3.5 text-slate-400" />}
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{inv.invoice_number}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{inv.customer_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">₹{inv.grand_total?.toFixed(2)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">No invoices yet. Start billing from the POS module.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {revenueHidden ? (
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest font-medium text-slate-500 dark:text-slate-400">Total Stock Value</p>
                <div className="flex items-center gap-2 mt-2">
                  <EyeOff className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-400 italic">Permission required</span>
                </div>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-md">
                <Package className="h-6 w-6 text-slate-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest font-medium text-slate-500 dark:text-slate-400">Total Stock Value</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums mt-1">₹{stats?.stock_value?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
