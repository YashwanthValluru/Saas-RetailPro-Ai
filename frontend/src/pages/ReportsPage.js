import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PaymentCard from '@/components/PaymentCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BarChart3, TrendingUp, PieChart, Truck, Download, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend } from 'recharts';

const API = '/api';
const COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#DB2777', '#EA580C', '#4F46E5', '#059669'];

export default function ReportsPage() {
  const [tab, setTab] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesData, setSalesData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [categoryData, setCategoryData] = useState(null);
  const [purchaseData, setPurchaseData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      if (tab === 'sales') {
        const { data } = await axios.get(`${API}/reports/sales`, { params, withCredentials: true });
        setSalesData(data);
      } else if (tab === 'profit') {
        const { data } = await axios.get(`${API}/reports/profit-margins`, { params, withCredentials: true });
        setProfitData(data);
      } else if (tab === 'category') {
        const { data } = await axios.get(`${API}/reports/category-analysis`, { params, withCredentials: true });
        setCategoryData(data);
      } else if (tab === 'purchases') {
        const { data } = await axios.get(`${API}/reports/purchase-analytics`, { params, withCredentials: true });
        setPurchaseData(data);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You don\'t have permission to view revenue data. Contact your store owner.');
      } else {
        toast.error('Failed to load report');
      }
    }
    setLoading(false);
  }, [tab, startDate, endDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportReport = async (format) => {
    try {
      const res = await fetch(`${API}/export/invoices?format=${format}&start_date=${startDate}&end_date=${endDate}`, { credentials: 'include' });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `report.${format === 'excel' ? 'xlsx' : 'csv'}`; a.click();
    } catch { toast.error('Export failed'); }
  };

  const tabs = [
    { id: 'sales', label: 'Sales', icon: BarChart3 },
    { id: 'profit', label: 'Profit Margins', icon: TrendingUp },
    { id: 'category', label: 'Category Analysis', icon: PieChart },
    { id: 'purchases', label: 'Purchase Analytics', icon: Truck },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportReport('csv')} className="dark:border-slate-600 dark:text-slate-300"><Download className="h-4 w-4 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={() => exportReport('excel')} className="dark:border-slate-600 dark:text-slate-300"><Download className="h-4 w-4 mr-1" />Excel</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-all ${tab === t.id ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Date Filters */}
      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Start Date</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-44 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">End Date</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-44 dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
        </div>
        <Button variant="outline" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }} className="dark:border-slate-600 dark:text-slate-300">Clear</Button>
      </div>

      {loading && <div className="text-center py-8 text-slate-400">Loading...</div>}

      {/* Sales Report */}
      {tab === 'sales' && salesData && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PaymentCard className="dark:bg-slate-800">
              <CardContent className="p-4"><div className="flex items-center gap-3"><DollarSign className="h-8 w-8 text-green-600 p-1.5 bg-green-100 dark:bg-green-900/30 rounded" /><div><p className="text-xs text-slate-500 dark:text-slate-400">Total Revenue</p><p className="text-xl font-bold dark:text-white">₹{salesData.total_revenue?.toFixed(2)}</p></div></div></CardContent>
            </PaymentCard>
            <PaymentCard className="dark:bg-slate-800">
              <CardContent className="p-4"><div className="flex items-center gap-3"><Package className="h-8 w-8 text-blue-600 p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded" /><div><p className="text-xs text-slate-500 dark:text-slate-400">Total Tax</p><p className="text-xl font-bold dark:text-white">₹{salesData.total_tax?.toFixed(2)}</p></div></div></CardContent>
            </PaymentCard>
            <PaymentCard className="dark:bg-slate-800">
              <CardContent className="p-4"><div className="flex items-center gap-3"><ShoppingCart className="h-8 w-8 text-purple-600 p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded" /><div><p className="text-xs text-slate-500 dark:text-slate-400">Invoices</p><p className="text-xl font-bold dark:text-white">{salesData.invoice_count}</p></div></div></CardContent>
            </PaymentCard>
          </div>
          <PaymentCard className="dark:bg-slate-800"><CardHeader><CardTitle className="text-base dark:text-white">Top Products by Revenue</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData.top_products}><XAxis dataKey="name" tick={{fontSize: 11}} className="dark:fill-slate-400" /><YAxis tick={{fontSize: 11}} /><Tooltip /><Bar dataKey="revenue" fill="#2563EB" radius={[4,4,0,0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent></PaymentCard>
        </div>
      )}

      {/* Profit Margins */}
      {tab === 'profit' && profitData && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[{label:'Revenue', val: profitData.summary.total_revenue, color:'blue'}, {label:'Cost', val: profitData.summary.total_cost, color:'orange'}, {label:'Profit', val: profitData.summary.total_profit, color:'green'}, {label:'Margin', val: `${profitData.summary.overall_margin_pct}%`, color:'purple'}].map((s,i) => (
              <Card key={i} className="dark:bg-slate-800 dark:border-slate-700"><CardContent className="p-4"><p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p><p className={`text-xl font-bold text-${s.color}-600`}>{typeof s.val === 'number' ? `₹${s.val.toFixed(2)}` : s.val}</p></CardContent></Card>
            ))}
          </div>
          <Card className="dark:bg-slate-800 dark:border-slate-700"><CardHeader><CardTitle className="text-base dark:text-white">Product Margins</CardTitle></CardHeader><CardContent>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b dark:border-slate-600"><th className="text-left p-2 text-slate-500 dark:text-slate-400">Product</th><th className="text-right p-2 text-slate-500 dark:text-slate-400">Revenue</th><th className="text-right p-2 text-slate-500 dark:text-slate-400">Cost</th><th className="text-right p-2 text-slate-500 dark:text-slate-400">Profit</th><th className="text-right p-2 text-slate-500 dark:text-slate-400">Margin</th><th className="text-right p-2 text-slate-500 dark:text-slate-400">Qty</th></tr></thead><tbody>
              {profitData.products.map((p, i) => (
                <tr key={i} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="p-2 font-medium dark:text-white">{p.name}</td>
                  <td className="p-2 text-right tabular-nums dark:text-slate-300">₹{p.revenue.toFixed(2)}</td>
                  <td className="p-2 text-right tabular-nums dark:text-slate-300">₹{p.cost.toFixed(2)}</td>
                  <td className={`p-2 text-right tabular-nums font-medium ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{p.profit.toFixed(2)}</td>
                  <td className="p-2 text-right tabular-nums dark:text-slate-300">{p.margin_pct}%</td>
                  <td className="p-2 text-right tabular-nums dark:text-slate-300">{p.quantity_sold}</td>
                </tr>
              ))}
            </tbody></table></div>
          </CardContent></Card>
        </div>
      )}

      {/* Category Analysis */}
      {tab === 'category' && categoryData && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="dark:bg-slate-800 dark:border-slate-700"><CardHeader><CardTitle className="text-base dark:text-white">Revenue by Category</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RPieChart><Pie data={categoryData.categories} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({name, percent}) => `${name} ${(percent*100).toFixed(0)}%`}>
                  {categoryData.categories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip formatter={(v) => `₹${v.toFixed(2)}`} /><Legend /></RPieChart>
              </ResponsiveContainer>
            </CardContent></Card>
            <Card className="dark:bg-slate-800 dark:border-slate-700"><CardHeader><CardTitle className="text-base dark:text-white">Category Breakdown</CardTitle></CardHeader><CardContent>
              <div className="space-y-3">
                {categoryData.categories.map((c, i) => (
                  <div key={c.category} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                    <div className="flex-1">
                      <div className="flex justify-between"><span className="font-medium text-sm dark:text-white">{c.category}</span><span className="text-sm font-mono dark:text-slate-300">₹{c.revenue.toFixed(2)}</span></div>
                      <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400"><span>{c.quantity_sold} sold</span><span>{c.product_count} products</span><span>{c.revenue_share_pct}% share</span><span className={c.profit >= 0 ? 'text-green-600' : 'text-red-600'}>₹{c.profit.toFixed(2)} profit</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          </div>
        </div>
      )}

      {/* Purchase Analytics */}
      {tab === 'purchases' && purchaseData && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="dark:bg-slate-800 dark:border-slate-700"><CardContent className="p-4"><p className="text-xs text-slate-500 dark:text-slate-400">Total Spent</p><p className="text-xl font-bold dark:text-white">₹{purchaseData.total_spent?.toFixed(2)}</p></CardContent></Card>
            <Card className="dark:bg-slate-800 dark:border-slate-700"><CardContent className="p-4"><p className="text-xs text-slate-500 dark:text-slate-400">Total Orders</p><p className="text-xl font-bold dark:text-white">{purchaseData.total_orders}</p></CardContent></Card>
            <Card className="dark:bg-slate-800 dark:border-slate-700"><CardContent className="p-4"><p className="text-xs text-slate-500 dark:text-slate-400">Suppliers</p><p className="text-xl font-bold dark:text-white">{purchaseData.suppliers?.length || 0}</p></CardContent></Card>
          </div>
          {purchaseData.monthly_spending?.length > 0 && (
            <Card className="dark:bg-slate-800 dark:border-slate-700"><CardHeader><CardTitle className="text-base dark:text-white">Monthly Purchase Spending</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={purchaseData.monthly_spending}><XAxis dataKey="month" tick={{fontSize: 11}} /><YAxis tick={{fontSize: 11}} /><Tooltip formatter={(v) => `₹${v.toFixed(2)}`} /><Bar dataKey="spending" fill="#D97706" radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            </CardContent></Card>
          )}
          <Card className="dark:bg-slate-800 dark:border-slate-700"><CardHeader><CardTitle className="text-base dark:text-white">Supplier Breakdown</CardTitle></CardHeader><CardContent>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b dark:border-slate-600"><th className="text-left p-2 text-slate-500 dark:text-slate-400">Supplier</th><th className="text-right p-2 text-slate-500 dark:text-slate-400">Total Spent</th><th className="text-right p-2 text-slate-500 dark:text-slate-400">Orders</th><th className="text-right p-2 text-slate-500 dark:text-slate-400">Avg Order</th><th className="text-right p-2 text-slate-500 dark:text-slate-400">Items</th></tr></thead><tbody>
              {purchaseData.suppliers?.map((s, i) => (
                <tr key={i} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"><td className="p-2 font-medium dark:text-white">{s.name}</td><td className="p-2 text-right tabular-nums dark:text-slate-300">₹{s.total_spent.toFixed(2)}</td><td className="p-2 text-right dark:text-slate-300">{s.order_count}</td><td className="p-2 text-right tabular-nums dark:text-slate-300">₹{s.avg_order_value.toFixed(2)}</td><td className="p-2 text-right dark:text-slate-300">{s.items_ordered}</td></tr>
              ))}
            </tbody></table></div>
          </CardContent></Card>
        </div>
      )}
    </div>
  );
}
