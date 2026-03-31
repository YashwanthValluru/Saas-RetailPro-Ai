import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package, ScanLine, Download, Clock } from 'lucide-react';
import { ScanFromPhoneButton, BarcodeInput } from '@/components/BarcodeScanner';
import { useAuth } from '@/contexts/AuthContext';
import cacheService from '@/services/cacheService';

const API = '/api';

const emptyProduct = { name: '', sku: '', barcode: '', category: '', price: '', cost_price: '', stock: '', low_stock_threshold: '10', unit: 'pcs', batch_number: '', expiry_date: '', description: '', hsn_code: '', gst_rate: '' };

export default function InventoryPage() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id || '';
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expiryAlerts, setExpiryAlerts] = useState(null);
  const [showExpiry, setShowExpiry] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [lookupInfo, setLookupInfo] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);

  // External barcode lookup — auto-fills form with product info from barcode databases
  const lookupBarcode = useCallback(async (barcode) => {
    setLookingUp(true);
    try {
      // Check frontend cache first (barcode lookups cached for 24hr)
      const cachedLookup = cacheService.get(tenantId, `barcode_lookup:${barcode}`);
      if (cachedLookup) {
        if (cachedLookup.source === 'local_inventory' && cachedLookup.product) {
          const p = cachedLookup.product;
          setForm({ name: p.name, sku: p.sku || '', barcode: p.barcode || '', category: p.category || '', price: p.price, cost_price: p.cost_price || 0, stock: p.stock, low_stock_threshold: p.low_stock_threshold || 10, unit: p.unit || 'pcs', batch_number: p.batch_number || '', expiry_date: p.expiry_date || '', description: p.description || '', hsn_code: p.hsn_code || '', gst_rate: p.gst_rate || 0 });
          setEditId(p.id);
          setEditMode(true);
          setShowDialog(true);
          setLookupInfo(null);
          toast.success(`Found in inventory (cached): ${p.name}`);
          setLookingUp(false);
          return;
        }
        if (cachedLookup.found && cachedLookup.product_info) {
          const info = cachedLookup.product_info;
          const cleanCategory = (info.category || '').split('>').pop()?.trim() || info.category || '';
          setForm(prev => ({ ...prev, barcode, sku: barcode, name: info.name || '', category: cleanCategory || '', description: info.description || '' }));
          setEditMode(false);
          setShowDialog(true);
          setLookupInfo({ source: cachedLookup.source, brand: info.brand, weight: info.weight, images: info.images, priceHint: info.price_hint });
          toast.success('Product info loaded from cache!');
          setLookingUp(false);
          return;
        }
      }

      const { data } = await axios.get(`${API}/inventory/barcode-lookup/${barcode}`, { withCredentials: true });

      // Cache the result (24 hours for barcode lookups)
      cacheService.set(tenantId, `barcode_lookup:${barcode}`, data, 86400);

      if (data.source === 'local_inventory' && data.product) {
        const p = data.product;
        setForm({ name: p.name, sku: p.sku || '', barcode: p.barcode || '', category: p.category || '', price: p.price, cost_price: p.cost_price || 0, stock: p.stock, low_stock_threshold: p.low_stock_threshold || 10, unit: p.unit || 'pcs', batch_number: p.batch_number || '', expiry_date: p.expiry_date || '', description: p.description || '', hsn_code: p.hsn_code || '', gst_rate: p.gst_rate || 0 });
        setEditId(p.id);
        setEditMode(true);
        setShowDialog(true);
        setLookupInfo(null);
        toast.success(`Found in inventory: ${p.name} (Stock: ${p.stock})`);
        return;
      }
      if (data.found && data.product_info) {
        const info = data.product_info;
        const cleanCategory = (info.category || '').split('>').pop()?.trim() || info.category || '';
        setForm(prev => ({
          ...prev,
          barcode: barcode,
          sku: barcode,
          name: info.name || prev.name || '',
          category: cleanCategory || prev.category || '',
          description: info.description || prev.description || '',
        }));
        setEditMode(false);
        setShowDialog(true);
        setLookupInfo({ source: data.source, brand: info.brand, weight: info.weight, images: info.images, priceHint: info.price_hint });
        toast.success(`Product info found via ${data.source === 'upcitemdb' ? 'Barcode Database' : 'Open Food Facts'}! Review and edit before saving.`);
      } else {
        setForm({...emptyProduct, barcode: barcode, sku: barcode});
        setEditMode(false);
        setShowDialog(true);
        setLookupInfo(null);
        toast.info(`Barcode "${barcode}" not found in any database. Please enter details manually.`);
      }
    } catch {
      setForm({...emptyProduct, barcode: barcode, sku: barcode});
      setEditMode(false);
      setShowDialog(true);
      setLookupInfo(null);
      toast.info(`Barcode "${barcode}" — enter product details manually.`);
    } finally {
      setLookingUp(false);
    }
  }, [tenantId]);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/inventory/products`, {
        params: { search, category: catFilter, page, limit: 20 },
        withCredentials: true
      });
      setProducts(data.products);
      setTotal(data.total);
      setPages(data.pages);
      setAccessDenied(false);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessDenied(true);
        toast.error('Inventory access is restricted. Contact your store owner.');
      } else {
        toast.error('Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  }, [search, catFilter, page]);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${API}/inventory/categories`, { withCredentials: true });
      setCategories(data.categories);
    } catch {}
  };

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); }, []);

  const fetchExpiryAlerts = async () => {
    try {
      const { data } = await axios.get(`${API}/inventory/expiry-alerts?days=90`, { withCredentials: true });
      setExpiryAlerts(data);
    } catch {}
  };

  useEffect(() => { fetchExpiryAlerts(); }, []);

  const exportInventory = async (format) => {
    try {
      const res = await fetch(`${API}/export/inventory?format=${format}`, { credentials: 'include' });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `inventory.${format === 'excel' ? 'xlsx' : 'csv'}`; a.click();
      toast.success('Export started');
    } catch { toast.error('Export failed'); }
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
        stock: parseInt(form.stock) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 10,
        gst_rate: parseFloat(form.gst_rate) || 0,
      };
      if (editMode) {
        await axios.put(`${API}/inventory/products/${editId}`, payload, { withCredentials: true });
        toast.success('Product updated');
      } else {
        await axios.post(`${API}/inventory/products`, payload, { withCredentials: true });
        toast.success('Product added');
      }
      setShowDialog(false);
      setForm(emptyProduct);
      setEditMode(false);
      fetchProducts();
      fetchCategories();
      // Invalidate barcode lookup cache for the saved product's barcode
      if (form.barcode) {
        cacheService.invalidate(tenantId, `barcode_lookup:${form.barcode}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    }
  };

  const handleEdit = (p) => {
    setForm({ name: p.name, sku: p.sku || '', barcode: p.barcode || '', category: p.category || '', price: p.price, cost_price: p.cost_price || 0, stock: p.stock, low_stock_threshold: p.low_stock_threshold || 10, unit: p.unit || 'pcs', batch_number: p.batch_number || '', expiry_date: p.expiry_date || '', description: p.description || '', hsn_code: p.hsn_code || '', gst_rate: p.gst_rate || 0 });
    setEditId(p.id);
    setEditMode(true);
    setShowDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API}/inventory/products/${id}`, { withCredentials: true });
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  if (accessDenied) {
    return (
      <div data-testid="inventory-page" className="space-y-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-semibold dark:text-white">Inventory Access Restricted</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">You don't have permission to access inventory management. Contact your store owner to enable this access.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="inventory-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Inventory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{total} products</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportInventory('csv')} className="dark:border-slate-600 dark:text-slate-300"><Download className="h-4 w-4 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={() => exportInventory('excel')} className="dark:border-slate-600 dark:text-slate-300"><Download className="h-4 w-4 mr-1" />Excel</Button>
          {expiryAlerts && (expiryAlerts.total_expired > 0 || expiryAlerts.total_expiring > 0) && (
            <Button variant={expiryAlerts.total_expired > 0 ? "destructive" : "outline"} size="sm" onClick={() => setShowExpiry(!showExpiry)}>
              <Clock className="h-4 w-4 mr-1" />{expiryAlerts.total_expired} expired, {expiryAlerts.total_expiring} expiring
            </Button>
          )}
          <Button data-testid="add-product-btn" onClick={() => { setForm(emptyProduct); setEditMode(false); setShowDialog(true); }} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
          <ScanFromPhoneButton type="inventory" onBarcodeScan={(barcode, product) => {
            if (product) { 
              handleEdit(product);
              toast.success(`Found: ${product.name} (Stock: ${product.stock})`);
            } else { 
              lookupBarcode(barcode);
            }
          }} />
        </div>
      </div>

      {/* Expiry Alerts Panel */}
      {showExpiry && expiryAlerts && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardHeader className="py-3"><CardTitle className="text-base text-amber-800 dark:text-amber-300 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Batch & Expiry Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {expiryAlerts.expired.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">EXPIRED ({expiryAlerts.total_expired})</p>
                {expiryAlerts.expired.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1 text-sm">
                    <span className="font-medium text-red-800 dark:text-red-300">{p.name} <span className="text-xs text-red-500">(Batch: {p.batch_number || '-'})</span></span>
                    <span className="text-red-600 text-xs font-mono">Exp: {p.expiry_date}</span>
                  </div>
                ))}
              </div>
            )}
            {expiryAlerts.expiring_soon.length > 0 && (
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">EXPIRING SOON ({expiryAlerts.total_expiring})</p>
                {expiryAlerts.expiring_soon.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-1 text-sm">
                    <span className="font-medium text-amber-800 dark:text-amber-300">{p.name} <span className="text-xs text-amber-500">(Batch: {p.batch_number || '-'})</span></span>
                    <span className="text-amber-600 text-xs font-mono">{p.days_until_expiry} days left (Exp: {p.expiry_date})</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border border-slate-200 bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input data-testid="inventory-search-input" placeholder="Search by name, SKU, or barcode..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
            <Select value={catFilter} onValueChange={v => { setCatFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger data-testid="category-filter" className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <BarcodeInput
            onBarcodeScan={(barcode) => { lookupBarcode(barcode); }}
            placeholder="Scan or type barcode to find product..."
          />
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">SKU</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold text-right">Price</TableHead>
                <TableHead className="font-semibold text-right">Stock</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    {loading ? 'Loading...' : 'No products found. Add your first product.'}
                  </TableCell>
                </TableRow>
              ) : products.map(p => (
                <TableRow key={p.id} className="even:bg-slate-50 hover:bg-slate-50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900">{p.name}</p>
                      {p.batch_number && <p className="text-xs text-slate-400">Batch: {p.batch_number}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 font-mono text-sm">{p.sku || '-'}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{p.category || 'Uncategorized'}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums font-medium">₹{p.price?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`tabular-nums font-medium ${p.stock <= (p.low_stock_threshold || 10) ? 'text-red-600' : 'text-slate-900'}`}>
                      {p.stock}
                    </span>
                    {p.stock <= (p.low_stock_threshold || 10) && <AlertTriangle className="h-3.5 w-3.5 text-red-500 inline ml-1" />}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button data-testid={`edit-product-${p.id}`} variant="ghost" size="sm" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button>
                      <Button data-testid={`delete-product-${p.id}`} variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-slate-500">Page {page} of {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setLookupInfo(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editMode ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>

          {/* Barcode Lookup Info Banner */}
          {lookupInfo && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Product info auto-filled from barcode database
                </p>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Review and edit the details below before saving. Set your own price & stock.
              </p>
              {lookupInfo.brand && (
                <p className="text-xs text-blue-700 dark:text-blue-300"><span className="font-medium">Brand:</span> {lookupInfo.brand}</p>
              )}
              {lookupInfo.weight && (
                <p className="text-xs text-blue-700 dark:text-blue-300"><span className="font-medium">Weight/Size:</span> {lookupInfo.weight}</p>
              )}
              {lookupInfo.priceHint && (
                <p className="text-xs text-blue-700 dark:text-blue-300"><span className="font-medium">Reference Price:</span> ₹{lookupInfo.priceHint} (international — set your own price below)</p>
              )}
            </div>
          )}

          {lookingUp && (
            <div className="flex items-center justify-center py-4 gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm text-slate-500">Looking up barcode in product databases...</span>
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input data-testid="product-name-input" value={form.name} onChange={e => update('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input data-testid="product-sku-input" value={form.sku} onChange={e => update('sku', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Barcode</Label>
                <div className="relative">
                  <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input data-testid="product-barcode-input" value={form.barcode} onChange={e => update('barcode', e.target.value)} placeholder="Scan or enter barcode" className="pl-10 font-mono" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input data-testid="product-category-input" value={form.category} onChange={e => update('category', e.target.value)} placeholder="e.g. Medicines, Tools" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={v => update('unit', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pieces</SelectItem>
                  <SelectItem value="kg">Kilograms</SelectItem>
                  <SelectItem value="ltr">Liters</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Selling Price (₹)</Label>
                <Input data-testid="product-price-input" type="number" step="0.01" value={form.price} onChange={e => update('price', e.target.value)} onFocus={e => e.target.select()} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Cost Price (₹)</Label>
                <Input type="number" step="0.01" value={form.cost_price} onChange={e => update('cost_price', e.target.value)} onFocus={e => e.target.select()} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>GST Rate (%)</Label>
                <Input type="number" step="0.01" value={form.gst_rate} onChange={e => update('gst_rate', e.target.value)} onFocus={e => e.target.select()} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input data-testid="product-stock-input" type="number" value={form.stock} onChange={e => update('stock', e.target.value)} onFocus={e => e.target.select()} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Low Stock Alert</Label>
                <Input type="number" value={form.low_stock_threshold} onChange={e => update('low_stock_threshold', e.target.value)} onFocus={e => e.target.select()} placeholder="10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input value={form.batch_number} onChange={e => update('batch_number', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiry_date} onChange={e => update('expiry_date', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>HSN Code</Label>
              <Input value={form.hsn_code} onChange={e => update('hsn_code', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => update('description', e.target.value)} placeholder="Product description (optional)" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button data-testid="save-product-btn" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              {editMode ? 'Update' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
