import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Tag, Trash2, Edit, Gift } from 'lucide-react';

const API = '/api';

export default function PromoCodesPage() {
  const [codes, setCodes] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ code: '', discount_type: 'percentage', value: '', min_order_amount: '', max_discount: '', valid_to: '', max_uses: '', description: '' });
  const [loading, setLoading] = useState(true);

  const fetchCodes = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/promo-codes`, { withCredentials: true });
      setCodes(data.promo_codes || []);
    } catch (err) {
      if (err.response?.status === 403) toast.error('Premium feature - upgrade your plan');
      else toast.error('Failed to load promo codes');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCodes(); }, [fetchCodes]);

  const handleSave = async () => {
    if (!form.code || !form.value) { toast.error('Code and value are required'); return; }
    try {
      const payload = { ...form, value: parseFloat(form.value) || 0, min_order_amount: parseFloat(form.min_order_amount) || 0, max_discount: parseFloat(form.max_discount) || 0, max_uses: parseInt(form.max_uses) || 0 };
      if (editId) {
        await axios.put(`${API}/promo-codes/${editId}`, payload, { withCredentials: true });
        toast.success('Promo code updated');
      } else {
        await axios.post(`${API}/promo-codes`, payload, { withCredentials: true });
        toast.success('Promo code created');
      }
      setShowCreate(false); setEditId(null);
      setForm({ code: '', discount_type: 'percentage', value: '', min_order_amount: '', max_discount: '', valid_to: '', max_uses: '', description: '' });
      fetchCodes();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const handleEdit = (c) => {
    setForm({ code: c.code, discount_type: c.discount_type, value: c.value, min_order_amount: c.min_order_amount || '', max_discount: c.max_discount || '', valid_to: c.valid_to || '', max_uses: c.max_uses || '', description: c.description || '' });
    setEditId(c.id); setShowCreate(true);
  };

  const handleDelete = async (id) => {
    try { await axios.delete(`${API}/promo-codes/${id}`, { withCredentials: true }); toast.success('Deactivated'); fetchCodes(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div data-testid="promo-codes-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Promo Codes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1"><Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs mr-2">Premium</Badge>Create and manage discount codes</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm({ code: '', discount_type: 'percentage', value: '', min_order_amount: '', max_discount: '', valid_to: '', max_uses: '', description: '' }); setShowCreate(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> New Code
        </Button>
      </div>

      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                <TableHead className="dark:text-slate-300">Code</TableHead>
                <TableHead className="dark:text-slate-300">Discount</TableHead>
                <TableHead className="dark:text-slate-300">Min Order</TableHead>
                <TableHead className="dark:text-slate-300">Max Discount</TableHead>
                <TableHead className="dark:text-slate-300">Uses</TableHead>
                <TableHead className="dark:text-slate-300">Valid Until</TableHead>
                <TableHead className="dark:text-slate-300">Status</TableHead>
                <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map(c => (
                <TableRow key={c.id} className="even:bg-slate-50 dark:even:bg-slate-700/30">
                  <TableCell className="font-mono font-bold dark:text-white"><div className="flex items-center gap-2"><Tag className="h-4 w-4 text-purple-500" />{c.code}</div></TableCell>
                  <TableCell className="dark:text-slate-300">{c.discount_type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</TableCell>
                  <TableCell className="text-sm dark:text-slate-400">₹{c.min_order_amount || 0}</TableCell>
                  <TableCell className="text-sm dark:text-slate-400">{c.max_discount ? `₹${c.max_discount}` : 'No cap'}</TableCell>
                  <TableCell className="text-sm dark:text-slate-400">{c.current_uses}/{c.max_uses || '∞'}</TableCell>
                  <TableCell className="text-sm dark:text-slate-400">{c.valid_to ? new Date(c.valid_to).toLocaleDateString() : 'No expiry'}</TableCell>
                  <TableCell><Badge className={c.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700'}>{c.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}><Edit className="h-4 w-4" /></Button>
                    {c.is_active && <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
              {codes.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-500 dark:text-slate-400"><Gift className="h-8 w-8 mx-auto mb-2 text-slate-300" />{loading ? 'Loading...' : 'No promo codes yet'}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg dark:bg-slate-800">
          <DialogHeader><DialogTitle className="dark:text-white">{editId ? 'Edit' : 'Create'} Promo Code</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="dark:text-slate-300">Code *</Label><Input value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value.toUpperCase()}))} placeholder="SUMMER25" disabled={!!editId} className="font-mono dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm(p => ({...p, discount_type: v}))}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed (₹)</SelectItem></SelectContent>
                </Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label className="dark:text-slate-300">Value *</Label><Input type="number" value={form.value} onChange={e => setForm(p => ({...p, value: e.target.value}))} onFocus={e => e.target.select()} placeholder="25" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Min Order (₹)</Label><Input type="number" value={form.min_order_amount} onChange={e => setForm(p => ({...p, min_order_amount: e.target.value}))} onFocus={e => e.target.select()} placeholder="500" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Max Discount (₹)</Label><Input type="number" value={form.max_discount} onChange={e => setForm(p => ({...p, max_discount: e.target.value}))} onFocus={e => e.target.select()} placeholder="200" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="dark:text-slate-300">Valid Until</Label><Input type="datetime-local" value={form.valid_to?.slice(0, 16) || ''} onChange={e => setForm(p => ({...p, valid_to: e.target.value ? new Date(e.target.value).toISOString() : ''}))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Max Uses (0=unlimited)</Label><Input type="number" value={form.max_uses} onChange={e => setForm(p => ({...p, max_uses: e.target.value}))} onFocus={e => e.target.select()} placeholder="0" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
            </div>
            <div className="space-y-2"><Label className="dark:text-slate-300">Description</Label><Input value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Summer sale discount" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="dark:border-slate-600 dark:text-slate-300">Cancel</Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">{editId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
