import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, CreditCard, History, Download, X } from 'lucide-react';

const API = '';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showCredit, setShowCredit] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', gst_number: '', credit_limit: 0, notes: '' });
  const [creditForm, setCreditForm] = useState({ amount: 0, type: 'credit', reference: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/customers?search=${search}`, { credentials: 'include' });
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e) { console.error(e); }
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editing ? `${API}/api/customers/${editing}` : `${API}/api/customers`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ ...form, credit_limit: Number(form.credit_limit) }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail); }
      toast.success(editing ? 'Customer updated' : 'Customer created');
      setShowForm(false); setEditing(null); setForm({ name: '', phone: '', email: '', address: '', gst_number: '', credit_limit: 0, notes: '' });
      fetchCustomers();
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      const res = await fetch(`${API}/api/customers/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (e) { toast.error(e.message); }
  };

  const handleCredit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/customers/${showCredit}/credit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ ...creditForm, amount: Number(creditForm.amount) })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail); }
      toast.success('Credit adjusted');
      setShowCredit(null); setCreditForm({ amount: 0, type: 'credit', reference: '', notes: '' });
      fetchCustomers();
    } catch (e) { toast.error(e.message); }
  };

  const loadHistory = async (id) => {
    setShowHistory(id);
    try {
      const res = await fetch(`${API}/api/customers/${id}/transactions`, { credentials: 'include' });
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (e) { console.error(e); }
  };

  const exportData = async (format) => {
    try {
      const res = await fetch(`${API}/api/export/customers?format=${format}`, { credentials: 'include' });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `customers.${format === 'excel' ? 'xlsx' : 'csv'}`; a.click();
    } catch (e) { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customers</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportData('csv')} className="dark:border-slate-600 dark:text-slate-300"><Download className="h-4 w-4 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={() => exportData('excel')} className="dark:border-slate-600 dark:text-slate-300"><Download className="h-4 w-4 mr-1" />Excel</Button>
          {user?.role !== 'STAFF' && <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', phone: '', email: '', address: '', gst_number: '', credit_limit: 0, notes: '' }); }} size="sm"><Plus className="h-4 w-4 mr-1" />Add Customer</Button>}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 dark:bg-slate-800 dark:border-slate-600 dark:text-white" data-testid="customer-search" />
      </div>

      <div className="grid gap-3">
        {customers.map(c => (
          <Card key={c.id} className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{c.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{c.phone} {c.email && `| ${c.email}`}</p>
                  {c.address && <p className="text-xs text-slate-400 dark:text-slate-500">{c.address}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Credit Balance</p>
                    <p className={`font-mono font-bold ${c.credit_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{(c.credit_balance || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Purchases</p>
                    <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">₹{(c.total_purchases || 0).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1">
                    {user?.role !== 'STAFF' && <>
                      <Button variant="ghost" size="sm" onClick={() => setShowCredit(c.id)}><CreditCard className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => loadHistory(c.id)}><History className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(c.id); setForm(c); setShowForm(true); }}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {customers.length === 0 && <p className="text-center text-slate-500 py-8 dark:text-slate-400">No customers found</p>}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">{editing ? 'Edit' : 'Add'} Customer</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input placeholder="Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <Input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <Input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <Input placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <Input placeholder="GST Number" value={form.gst_number} onChange={e => setForm({...form, gst_number: e.target.value})} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <Input type="number" placeholder="Credit Limit (0 = unlimited)" value={form.credit_limit} onChange={e => setForm({...form, credit_limit: e.target.value})} onFocus={e => e.target.select()} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <Input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Credit Adjustment Modal */}
      {showCredit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">Adjust Credit</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCredit(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCredit} className="space-y-3">
                <select value={creditForm.type} onChange={e => setCreditForm({...creditForm, type: e.target.value})} className="w-full rounded-md border border-slate-200 p-2 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <option value="credit">Add Credit (Customer Owes)</option>
                  <option value="payment">Record Payment</option>
                </select>
                <Input type="number" step="0.01" placeholder="Amount" value={creditForm.amount} onChange={e => setCreditForm({...creditForm, amount: e.target.value})} onFocus={e => e.target.select()} required className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <Input placeholder="Reference (invoice #, etc)" value={creditForm.reference} onChange={e => setCreditForm({...creditForm, reference: e.target.value})} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <Input placeholder="Notes" value={creditForm.notes} onChange={e => setCreditForm({...creditForm, notes: e.target.value})} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <Button type="submit" className="w-full">Submit</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transaction History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-auto dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">Transaction History</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowHistory(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? <p className="text-slate-500 dark:text-slate-400">No transactions</p> : (
                <div className="space-y-2">
                  {transactions.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 border rounded dark:border-slate-600">
                      <div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${t.type === 'credit' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>{t.type}</span>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{t.reference || t.notes || '-'}</p>
                        <p className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-bold ${t.type === 'credit' ? 'text-red-600' : 'text-green-600'}`}>{t.type === 'credit' ? '+' : '-'}₹{t.amount.toFixed(2)}</p>
                        <p className="text-xs text-slate-400">Bal: ₹{t.balance_after.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
