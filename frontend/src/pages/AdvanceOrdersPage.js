import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, CreditCard, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';

const API = '/api';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  fulfilled: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function AdvanceOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', advance_amount: '', total_estimated: '', notes: '', products: [{ name: '', quantity: 1, price: '', notes: '' }] });

  const fetchOrders = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await axios.get(`${API}/advance-orders`, { params, withCredentials: true });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) {
      if (err.response?.status === 403) toast.error('Premium feature');
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const addProductRow = () => setForm(p => ({ ...p, products: [...p.products, { name: '', quantity: 1, price: '', notes: '' }] }));
  const updateProduct = (i, key, val) => setForm(p => { const prods = [...p.products]; prods[i] = { ...prods[i], [key]: val }; return { ...p, products: prods }; });
  const removeProduct = (i) => setForm(p => ({ ...p, products: p.products.filter((_, idx) => idx !== i) }));

  const handleCreate = async () => {
    if (!form.customer_name || !form.advance_amount || form.products.length === 0) { toast.error('Customer name, advance amount, and at least one product required'); return; }
    try {
      const totalEst = form.total_estimated || form.products.reduce((s, p) => s + (parseFloat(p.price) || 0) * (parseInt(p.quantity) || 1), 0);
      await axios.post(`${API}/advance-orders`, {
        ...form, advance_amount: parseFloat(form.advance_amount),
        total_estimated: parseFloat(totalEst),
        products: form.products.filter(p => p.name).map(p => ({ ...p, quantity: parseInt(p.quantity) || 1, price: parseFloat(p.price) || 0 }))
      }, { withCredentials: true });
      toast.success('Advance order created');
      setShowCreate(false);
      setForm({ customer_name: '', customer_phone: '', advance_amount: '', total_estimated: '', notes: '', products: [{ name: '', quantity: 1, price: '', notes: '' }] });
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const fulfill = async (id) => {
    try { await axios.put(`${API}/advance-orders/${id}/fulfill`, {}, { withCredentials: true }); toast.success('Order fulfilled'); fetchOrders(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const cancel = async (id) => {
    try { await axios.put(`${API}/advance-orders/${id}/cancel`, {}, { withCredentials: true }); toast.success('Order cancelled'); fetchOrders(); }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  return (
    <div data-testid="advance-orders-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Advance Orders</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1"><Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs mr-2">Premium</Badge>Manage advance payments and pre-orders</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-2" />New Advance Order</Button>
      </div>

      <div className="flex gap-2">
        {['', 'pending', 'fulfilled', 'cancelled'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? 'bg-blue-600 text-white' : 'dark:border-slate-600 dark:text-slate-300'}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </Button>
        ))}
      </div>

      <Card className="border dark:border-slate-700 bg-white dark:bg-slate-800"><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="bg-slate-50 dark:bg-slate-700/50">
            <TableHead className="dark:text-slate-300">Customer</TableHead><TableHead className="dark:text-slate-300">Products</TableHead><TableHead className="dark:text-slate-300">Total Est.</TableHead><TableHead className="dark:text-slate-300">Advance</TableHead><TableHead className="dark:text-slate-300">Balance</TableHead><TableHead className="dark:text-slate-300">Status</TableHead><TableHead className="dark:text-slate-300">Date</TableHead><TableHead className="text-right dark:text-slate-300">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {orders.map(o => (
              <TableRow key={o.id} className="even:bg-slate-50 dark:even:bg-slate-700/30 cursor-pointer" onClick={() => setShowDetail(o)}>
                <TableCell className="dark:text-white">{o.customer_name}<br/><span className="text-xs text-slate-400">{o.customer_phone}</span></TableCell>
                <TableCell className="text-sm dark:text-slate-300">{o.products?.length || 0} item(s)</TableCell>
                <TableCell className="font-mono dark:text-slate-300">₹{o.total_estimated?.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-green-600 dark:text-green-400">₹{o.advance_amount?.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-amber-600 dark:text-amber-400">₹{o.balance_due?.toFixed(2)}</TableCell>
                <TableCell><Badge className={`${STATUS_STYLES[o.status]} text-xs`}>{o.status}</Badge></TableCell>
                <TableCell className="text-sm text-slate-400">{new Date(o.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                  {o.status === 'pending' && <>
                    <Button variant="ghost" size="sm" onClick={() => fulfill(o.id)} className="text-green-600" title="Fulfill"><CheckCircle className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => cancel(o.id)} className="text-red-500" title="Cancel"><XCircle className="h-4 w-4" /></Button>
                  </>}
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-500"><CreditCard className="h-8 w-8 mx-auto mb-2 text-slate-300" />{loading ? 'Loading...' : 'No advance orders'}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent></Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl dark:bg-slate-800 max-h-[85vh] overflow-auto">
          <DialogHeader><DialogTitle className="dark:text-white">New Advance Order</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="dark:text-slate-300">Customer Name *</Label><Input value={form.customer_name} onChange={e => setForm(p => ({...p, customer_name: e.target.value}))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Phone</Label><Input value={form.customer_phone} onChange={e => setForm(p => ({...p, customer_phone: e.target.value}))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
            </div>
            <div><Label className="dark:text-slate-300 mb-2 block">Products</Label>
              {form.products.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                  <Input className="col-span-4 dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Product name" value={p.name} onChange={e => updateProduct(i, 'name', e.target.value)} />
                  <Input className="col-span-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white" type="number" placeholder="Qty" value={p.quantity} onChange={e => updateProduct(i, 'quantity', e.target.value)} onFocus={e => e.target.select()} />
                  <Input className="col-span-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" type="number" placeholder="Price" value={p.price} onChange={e => updateProduct(i, 'price', e.target.value)} onFocus={e => e.target.select()} />
                  <Input className="col-span-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Notes" value={p.notes} onChange={e => updateProduct(i, 'notes', e.target.value)} />
                  <Button variant="ghost" size="sm" className="col-span-1 text-red-500" onClick={() => removeProduct(i)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addProductRow} className="mt-1 dark:border-slate-600 dark:text-slate-300"><Plus className="h-3 w-3 mr-1" />Add Product</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="dark:text-slate-300">Total Estimated (₹)</Label><Input type="number" value={form.total_estimated} onChange={e => setForm(p => ({...p, total_estimated: e.target.value}))} onFocus={e => e.target.select()} placeholder="Auto-calculated if empty" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Advance Amount (₹) *</Label><Input type="number" value={form.advance_amount} onChange={e => setForm(p => ({...p, advance_amount: e.target.value}))} onFocus={e => e.target.select()} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
            </div>
            <div className="space-y-2"><Label className="dark:text-slate-300">Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} rows={2} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="dark:border-slate-600 dark:text-slate-300">Cancel</Button>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">Advance Order Detail</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDetail(null)}>Close</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500">Customer</p><p className="font-medium dark:text-white">{showDetail.customer_name}</p></div>
                <div><p className="text-xs text-slate-500">Phone</p><p className="dark:text-slate-300">{showDetail.customer_phone || '-'}</p></div>
                <div><p className="text-xs text-slate-500">Total</p><p className="font-mono dark:text-white">₹{showDetail.total_estimated?.toFixed(2)}</p></div>
                <div><p className="text-xs text-slate-500">Advance</p><p className="font-mono text-green-600">₹{showDetail.advance_amount?.toFixed(2)}</p></div>
                <div><p className="text-xs text-slate-500">Balance Due</p><p className="font-mono text-amber-600">₹{showDetail.balance_due?.toFixed(2)}</p></div>
                <div><p className="text-xs text-slate-500">Status</p><Badge className={`${STATUS_STYLES[showDetail.status]} text-xs`}>{showDetail.status}</Badge></div>
              </div>
              <div><p className="text-xs text-slate-500 mb-1">Products</p>
                {showDetail.products?.map((p, i) => (
                  <div key={i} className="flex justify-between py-1 border-b dark:border-slate-700 text-sm">
                    <span className="dark:text-slate-300">{p.name} x{p.quantity}</span>
                    <span className="font-mono dark:text-white">₹{(p.price * p.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {showDetail.notes && <div><p className="text-xs text-slate-500">Notes</p><p className="text-sm dark:text-slate-300">{showDetail.notes}</p></div>}
              <p className="text-xs text-slate-400">Created: {new Date(showDetail.created_at).toLocaleString()} by {showDetail.created_by_name}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
