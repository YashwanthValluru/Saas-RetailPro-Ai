import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Activity, Wifi, WifiOff, Package, ShoppingCart, ArrowRightLeft, AlertTriangle, TrendingUp, Building2, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;
const WS_URL = API.replace('https://', 'wss://').replace('http://', 'ws://');

function EventIcon({ type }) {
  const icons = {
    invoice_created: <ShoppingCart className="h-4 w-4 text-green-500" />,
    stock_adjusted: <Package className="h-4 w-4 text-blue-500" />,
    transfer_approved: <ArrowRightLeft className="h-4 w-4 text-indigo-500" />,
    low_stock: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  };
  return icons[type] || <Activity className="h-4 w-4 text-slate-400" />;
}

function HealthBar({ score }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
      <div className={`h-2 rounded-full transition-all duration-500 ${color}`} style={{ width: score + '%' }} />
    </div>
  );
}

export default function RealtimeDashboardPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, alertsRes] = await Promise.all([
        fetch(API + '/api/realtime/dashboard', { credentials: 'include' }),
        fetch(API + '/api/realtime/stock-alerts', { credentials: 'include' }),
      ]);
      if (dashRes.ok) setDashboard(await dashRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
    } catch (e) { console.error('Dashboard fetch error:', e); }
    setLoading(false);
  }, []);

  const connectWS = useCallback(() => {
    if (!user?.tenant_id) return;
    try {
      const ws = new WebSocket(WS_URL + '/ws/inventory/' + user.tenant_id);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        if (reconnectRef.current) clearTimeout(reconnectRef.current);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init') {
            setLiveEvents(data.events || []);
          } else if (data.type !== 'pong') {
            setLiveEvents(prev => [...prev.slice(-99), data]);
            // Auto-refresh dashboard on stock changes
            if (['invoice_created', 'stock_adjusted', 'transfer_approved'].includes(data.type)) {
              fetchDashboard();
            }
          }
        } catch {}
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectRef.current = setTimeout(connectWS, 5000);
      };

      ws.onerror = () => { ws.close(); };

      // Heartbeat
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 30000);

      return () => {
        clearInterval(pingInterval);
        ws.close();
      };
    } catch { setWsConnected(false); }
  }, [user?.tenant_id, fetchDashboard]);

  useEffect(() => {
    fetchDashboard();
    const cleanup = connectWS();
    const refreshInterval = setInterval(fetchDashboard, 30000);
    return () => {
      cleanup && cleanup();
      clearInterval(refreshInterval);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchDashboard, connectWS]);

  if (loading) return <div className="flex items-center justify-center h-64" data-testid="realtime-loading"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  const stats = dashboard?.live_stats || {};
  const branchHealth = dashboard?.branch_health || [];
  const hourly = dashboard?.hourly_activity || [];
  const topMovers = dashboard?.top_movers || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 shadow-xl text-xs">
        <p className="font-medium text-slate-700 dark:text-slate-300">{label}:00</p>
        {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5" data-testid="realtime-dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-7 w-7 text-emerald-500" /> Real-Time Inventory Sync
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Live stock movements across all branches</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ' + (wsConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300')} data-testid="ws-status">
            {wsConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {wsConnected ? 'Live' : 'Reconnecting...'}
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboard} data-testid="refresh-btn">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3" data-testid="live-stats">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><ShoppingCart className="h-3.5 w-3.5" /> Orders (24h)</div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{stats.orders_24h || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><TrendingUp className="h-3.5 w-3.5" /> Revenue (24h)</div>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">Rs.{(stats.revenue_24h || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><Package className="h-3.5 w-3.5" /> Items Sold (24h)</div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{stats.items_sold_24h || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><ArrowRightLeft className="h-3.5 w-3.5" /> Transfers (24h)</div>
          <p className="text-2xl font-bold text-indigo-600 tabular-nums">{stats.transfers_24h || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><Wifi className="h-3.5 w-3.5" /> Connected</div>
          <p className="text-2xl font-bold text-blue-600 tabular-nums">{stats.connected_clients || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Branch Health */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="branch-health">
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-500" /> Branch Health Monitor
            </h3>
            {branchHealth.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No branches configured</p>
            ) : (
              <div className="space-y-3">
                {branchHealth.map(b => (
                  <div key={b.branch_id} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg" data-testid={'branch-health-' + b.branch_id}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium text-sm text-slate-900 dark:text-white">{b.name}</span>
                        {b.code && <span className="text-xs text-slate-400 ml-2 font-mono">{b.code}</span>}
                      </div>
                      <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + (b.health_score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : b.health_score >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300')}>
                        {b.health_score}% Health
                      </span>
                    </div>
                    <HealthBar score={b.health_score} />
                    <div className="grid grid-cols-5 gap-2 mt-2 text-xs">
                      <div><span className="text-slate-400">Products</span><br /><span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">{b.products}</span></div>
                      <div><span className="text-slate-400">Revenue</span><br /><span className="font-medium text-emerald-600 tabular-nums">Rs.{b.today_revenue?.toLocaleString('en-IN')}</span></div>
                      <div><span className="text-slate-400">Orders</span><br /><span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">{b.today_orders}</span></div>
                      <div><span className="text-amber-500">Low Stock</span><br /><span className="font-medium text-amber-600 tabular-nums">{b.low_stock}</span></div>
                      <div><span className="text-red-500">Out</span><br /><span className="font-medium text-red-600 tabular-nums">{b.out_of_stock}</span></div>
                    </div>
                    {(b.pending_transfers_in > 0 || b.pending_transfers_out > 0) && (
                      <div className="flex gap-3 mt-2 text-xs">
                        {b.pending_transfers_in > 0 && <span className="text-indigo-500">Incoming: {b.pending_transfers_in}</span>}
                        {b.pending_transfers_out > 0 && <span className="text-orange-500">Outgoing: {b.pending_transfers_out}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hourly Activity */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="hourly-activity">
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" /> Hourly Activity (24h)
            </h3>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={v => v + ':00'} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="orders" fill="#8B5CF6" radius={[3, 3, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Live Event Feed + Alerts */}
        <div className="space-y-4">
          {/* Live Event Feed */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="live-event-feed">
            <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" /> Live Feed
              {wsConnected && <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-2 w-2 rounded-full bg-green-400 opacity-75" /><span className="relative rounded-full h-2 w-2 bg-green-500" /></span>}
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {liveEvents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No live events yet. Events will appear as stock changes occur.</p>
              ) : (
                [...liveEvents].reverse().map((evt, i) => (
                  <div key={evt.id || i} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-slate-700/30 rounded-lg animate-in slide-in-from-top-2" data-testid={'event-' + i}>
                    <EventIcon type={evt.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-800 dark:text-slate-200">
                        {evt.type === 'invoice_created' && ('Sale: Rs.' + evt.grand_total?.toLocaleString('en-IN') + ' (' + evt.items_count + ' items)')}
                        {evt.type === 'stock_adjusted' && (evt.product_name + ': ' + evt.old_stock + ' -> ' + evt.new_stock)}
                        {evt.type === 'transfer_approved' && ('Transfer: ' + evt.quantity + 'x ' + evt.product_name)}
                      </p>
                      <p className="text-[10px] text-slate-400 tabular-nums">{evt.timestamp?.slice(11, 19)} | {evt.user}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Stock Alerts */}
          {alerts && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="stock-alerts">
              <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" /> Stock Alerts
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs px-2">
                  <span className="text-red-500 font-medium">Out of Stock: {alerts.summary?.out_of_stock_count || 0}</span>
                  <span className="text-amber-500 font-medium">Low Stock: {alerts.summary?.low_stock_count || 0}</span>
                </div>
                {alerts.imbalances?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">Stock Imbalances:</p>
                    {alerts.imbalances.slice(0, 5).map((imb, i) => (
                      <div key={i} className="text-xs p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded mb-1" data-testid={'imbalance-' + i}>
                        <p className="font-medium text-slate-700 dark:text-slate-300">{imb.product_name}</p>
                        <div className="flex gap-2 mt-1">
                          {imb.branches?.map((b, j) => (
                            <span key={j} className={'px-1.5 py-0.5 rounded text-[10px] ' + (b.stock <= 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600')}>
                              {b.branch_name}: {b.stock}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="max-h-40 overflow-y-auto space-y-1 mt-2">
                  {alerts.out_of_stock?.slice(0, 8).map((p, i) => (
                    <div key={i} className="flex justify-between text-xs px-2 py-1 bg-red-50 dark:bg-red-900/10 rounded">
                      <span className="text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                      <span className="text-red-500 shrink-0 ml-2">{p.branch_name}</span>
                    </div>
                  ))}
                  {alerts.low_stock?.slice(0, 8).map((p, i) => (
                    <div key={i} className="flex justify-between text-xs px-2 py-1 bg-amber-50 dark:bg-amber-900/10 rounded">
                      <span className="text-slate-700 dark:text-slate-300 truncate">{p.name} ({p.stock})</span>
                      <span className="text-amber-500 shrink-0 ml-2">{p.branch_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Top Movers */}
          {topMovers.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5" data-testid="top-movers">
              <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" /> Top Movers (24h)
              </h3>
              <div className="space-y-1">
                {topMovers.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-xs px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 tabular-nums w-4">{i + 1}.</span>
                      <span className="text-slate-800 dark:text-slate-200 truncate">{m.name}</span>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <span className="text-blue-600 tabular-nums">{m.qty} sold</span>
                      <span className="text-emerald-600 tabular-nums">Rs.{m.revenue?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
