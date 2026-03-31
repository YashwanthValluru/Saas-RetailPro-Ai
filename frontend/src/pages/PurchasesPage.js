import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PaymentCard from '@/components/PaymentCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Truck, Package, Trash2, CheckCircle, Building2, ClipboardList } from 'lucide-react';

const API = '/api';

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800',
  partial: 'bg-blue-100 text-blue-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function PurchasesPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [showPODialog, setShowPODialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);

  // Forms
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', gst_number: '' });
  const [poForm, setPOForm] = useState({ supplier_id: '', items: [{ product_id: '', product_name: '', quantity: 1, unit_cost: '', gst_rate: '' }], notes: '', expected_date: '' });
  const [receiveForm, setReceiveForm] = useState({ purchase_id: '', items: [] });

  const fetchPurchases = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/purchases`, { params: { page, status: statusFilter, limit: 20 }, withCredentials: true });
      setPurchases(data.purchases);
      setTotal(data.total);
      setPages(data.pages);
    } catch { } finally { setLoading(false); }
  }, [page, statusFilter]);

  const fetchSuppliers = async () => {
    try {
      const { data } = await axios.get(`${API}/purchases/suppliers`, { withCredentials: true });
      setSuppliers(data.suppliers);
    } catch { }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API}/inventory/products`, { params: { limit: 500 }, withCredentials: true });
      setProducts(data.products);
    } catch { }
  };

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);
  useEffect(() => { fetchSuppliers(); fetchProducts(); }, []);

  // Supplier CRUD
  const handleCreateSupplier = async () => {
    try {
      await axios.post(`${API}/purchases/suppliers`, supplierForm, { withCredentials: true });
      toast.success('Supplier added');
      setShowSupplierDialog(false);
      setSupplierForm({ name: '', contact_person: '', phone: '', email: '', address: '', gst_number: '' });
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try {
      await axios.delete(`${API}/purchases/suppliers/${id}`, { withCredentials: true });
      toast.success('Supplier deleted');
      fetchSuppliers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  // Purchase Order
  const addPOItem = () => {
    setPOForm(prev => ({ ...prev, items: [...prev.items, { product_id: '', product_name: '', quantity: 1, unit_cost: '', gst_rate: '' }] }));
  };

  const updatePOItem = (index, field, value) => {
    setPOForm(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      if (field === 'product_id' && value) {
        const p = products.find(pr => pr.id === value);
        if (p) {
          items[index].product_name = p.name;
          items[index].unit_cost = p.cost_price || p.price;
          items[index].gst_rate = p.gst_rate || 0;
        }
      }
      return { ...prev, items };
    });
  };

  const removePOItem = (index) => {
    setPOForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleCreatePO = async () => {
    if (!poForm.supplier_id) { toast.error('Select a supplier'); return; }
    if (poForm.items.some(i => !i.product_name || (parseInt(i.quantity) || 0) <= 0)) { toast.error('Fill in all item details'); return; }
    try {
      const payload = {
        ...poForm,
        items: poForm.items.map(i => ({
          ...i,
          quantity: parseInt(i.quantity) || 0,
          unit_cost: parseFloat(i.unit_cost) || 0,
          gst_rate: parseFloat(i.gst_rate) || 0,
        }))
      };
      await axios.post(`${API}/purchases`, payload, { withCredentials: true });
      toast.success('Purchase order created');
      setShowPODialog(false);
      setPOForm({ supplier_id: '', items: [{ product_id: '', product_name: '', quantity: 1, unit_cost: '', gst_rate: '' }], notes: '', expected_date: '' });
      fetchPurchases();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create PO');
    }
  };

  // Receive
  const openReceiveDialog = (purchase) => {
    setReceiveForm({
      purchase_id: purchase.id,
      items: purchase.items.map(i => ({ product_id: i.product_id, product_name: i.product_name, ordered: i.quantity, received_qty: i.quantity }))
    });
    setShowReceiveDialog(true);
  };

  const handleReceive = async () => {
    try {
      await axios.post(`${API}/purchases/${receiveForm.purchase_id}/receive`,
        { items: receiveForm.items.map(i => ({ product_id: i.product_id, received_qty: i.received_qty })) },
        { withCredentials: true }
      );
      toast.success('Purchase received - stock updated');
      setShowReceiveDialog(false);
      fetchPurchases();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to receive');
    }
  };

  const handleDeletePO = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try {
      await axios.delete(`${API}/purchases/${id}`, { withCredentials: true });
      toast.success('Purchase order deleted');
      fetchPurchases();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
  };

  const poTotal = poForm.items.reduce((sum, i) => sum + ((parseFloat(i.unit_cost) || 0) * (parseInt(i.quantity) || 0)) + ((parseFloat(i.unit_cost) || 0) * (parseInt(i.quantity) || 0) * (parseFloat(i.gst_rate) || 0) / 100), 0);

  return (
    <div data-testid="purchases-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Purchase Management</h1>
          <p className="text-slate-500 mt-1">{total} purchase orders</p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="add-supplier-btn" variant="outline" onClick={() => setShowSupplierDialog(true)}>
            <Building2 className="h-4 w-4 mr-2" /> Add Supplier
          </Button>
          <Button data-testid="create-po-btn" onClick={() => setShowPODialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> New Purchase Order
          </Button>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders" data-testid="tab-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="suppliers" data-testid="tab-suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <PaymentCard className="bg-white dark:bg-slate-800">
            <CardContent className="p-4">
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger data-testid="po-status-filter" className="w-48 dark:bg-slate-700 dark:border-slate-600">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partially Received</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </PaymentCard>

          <PaymentCard className="bg-white dark:bg-slate-800 mt-4">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map(po => (
                    <TableRow key={po.id} className="even:bg-slate-50">
                      <TableCell className="font-mono font-medium text-sm">{po.po_number}</TableCell>
                      <TableCell>{po.supplier_name}</TableCell>
                      <TableCell>{po.items?.length || 0} items</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">₹{po.grand_total?.toFixed(2)}</TableCell>
                      <TableCell><Badge className={`${STATUS_COLORS[po.status] || STATUS_COLORS.pending} text-xs`}>{po.status}</Badge></TableCell>
                      <TableCell className="text-sm text-slate-500">{new Date(po.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {po.status !== 'received' && (
                            <Button data-testid={`receive-po-${po.id}`} variant="ghost" size="sm" onClick={() => openReceiveDialog(po)} className="text-green-600 hover:text-green-700" title="Receive">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {po.status !== 'received' && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePO(po.id)} className="text-red-500 hover:text-red-700" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchases.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                        <ClipboardList className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        {loading ? 'Loading...' : 'No purchase orders yet'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </PaymentCard>

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="dark:border-slate-600">Previous</Button>
              <span className="flex items-center text-sm text-slate-500 dark:text-slate-400">Page {page} of {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="dark:border-slate-600">Next</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="suppliers">
          <PaymentCard className="bg-white dark:bg-slate-800">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Supplier</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map(s => (
                    <TableRow key={s.id} className="even:bg-slate-50">
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>{s.contact_person || '-'}</TableCell>
                      <TableCell className="text-sm">{s.phone || '-'}</TableCell>
                      <TableCell className="text-sm">{s.email || '-'}</TableCell>
                      <TableCell className="text-sm font-mono">{s.gst_number || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSupplier(s.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {suppliers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                        <Building2 className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        No suppliers added yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </PaymentCard>
        </TabsContent>
      </Tabs>

      {/* Add Supplier Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Add Supplier</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Supplier Name *</Label>
              <Input data-testid="supplier-name-input" value={supplierForm.name} onChange={e => setSupplierForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input value={supplierForm.contact_person} onChange={e => setSupplierForm(p => ({ ...p, contact_person: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={supplierForm.phone} onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={supplierForm.email} onChange={e => setSupplierForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input value={supplierForm.gst_number} onChange={e => setSupplierForm(p => ({ ...p, gst_number: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSupplierDialog(false)}>Cancel</Button>
            <Button data-testid="save-supplier-btn" onClick={handleCreateSupplier} className="bg-blue-600 hover:bg-blue-700 text-white">Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create PO Dialog */}
      <Dialog open={showPODialog} onOpenChange={setShowPODialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading">New Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Select value={poForm.supplier_id} onValueChange={v => setPOForm(p => ({ ...p, supplier_id: v }))}>
                  <SelectTrigger data-testid="po-supplier-select"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Date</Label>
                <Input type="date" value={poForm.expected_date} onChange={e => setPOForm(p => ({ ...p, expected_date: e.target.value }))} />
              </div>
            </div>

            <Separator />
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Items</Label>
              <Button data-testid="add-po-item-btn" variant="outline" size="sm" onClick={addPOItem}>
                <Plus className="h-3 w-3 mr-1" /> Add Item
              </Button>
            </div>

            {poForm.items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end border p-3 rounded-md bg-slate-50">
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">Product</Label>
                  <Select value={item.product_id} onValueChange={v => updatePOItem(i, 'product_id', v)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min="1" value={item.quantity} onChange={e => updatePOItem(i, 'quantity', e.target.value === '' ? '' : (parseInt(e.target.value) || ''))} onFocus={e => e.target.select()} className="h-8 text-sm" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Unit Cost</Label>
                  <Input type="number" step="0.01" value={item.unit_cost} onChange={e => updatePOItem(i, 'unit_cost', e.target.value === '' ? '' : (parseFloat(e.target.value) || ''))} onFocus={e => e.target.select()} className="h-8 text-sm" />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">GST %</Label>
                  <Input type="number" step="0.01" value={item.gst_rate} onChange={e => updatePOItem(i, 'gst_rate', e.target.value === '' ? '' : (parseFloat(e.target.value) || ''))} onFocus={e => e.target.select()} className="h-8 text-sm" />
                </div>
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs">Total</Label>
                  <p className="text-sm font-medium tabular-nums h-8 flex items-center">₹{((parseFloat(item.unit_cost) || 0) * (parseInt(item.quantity) || 0) * (1 + (parseFloat(item.gst_rate) || 0) / 100)).toFixed(2)}</p>
                </div>
                <div className="col-span-1">
                  {poForm.items.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => removePOItem(i)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <p className="text-lg font-bold tabular-nums">Total: ₹{poTotal.toFixed(2)}</p>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={poForm.notes} onChange={e => setPOForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPODialog(false)}>Cancel</Button>
            <Button data-testid="save-po-btn" onClick={handleCreatePO} className="bg-blue-600 hover:bg-blue-700 text-white">Create PO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive PO Dialog */}
      <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2"><Truck className="h-5 w-5 text-green-600" /> Receive Goods</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {receiveForm.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-md bg-slate-50">
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product_name}</p>
                  <p className="text-xs text-slate-500">Ordered: {item.ordered}</p>
                </div>
                <div className="w-24">
                  <Label className="text-xs">Received</Label>
                  <Input
                    type="number"
                    min="0"
                    max={item.ordered}
                    value={item.received_qty}
                    onChange={e => {
                      const items = [...receiveForm.items];
                      items[i] = { ...items[i], received_qty: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) };
                      setReceiveForm(prev => ({ ...prev, items }));
                    }}
                    onFocus={e => e.target.select()}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiveDialog(false)}>Cancel</Button>
            <Button data-testid="confirm-receive-btn" onClick={handleReceive} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="h-4 w-4 mr-2" /> Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
