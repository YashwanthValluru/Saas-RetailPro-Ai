import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUISettings } from '@/contexts/UISettingsContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Receipt, X, ScanLine, FileText, Printer, Download, Tag, PackagePlus, Share2, MessageCircle, Copy, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import { ScanFromPhoneButton, BarcodeInput } from '@/components/BarcodeScanner';

const API = '/api';

export default function POSPage() {
  const { getBorderStyles } = useUISettings();
  const borderStyles = getBorderStyles();
  
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const searchRef = useRef(null);

  // Digital Receipt State
  const [showShareReceipt, setShowShareReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [sharePhone, setSharePhone] = useState('');

  // Smart Substitution State
  const [substitutes, setSubstitutes] = useState(null);
  const [showSubstitutes, setShowSubstitutes] = useState(false);
  const [aiSubstituting, setAiSubstituting] = useState(false);

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Add Product Dialog State
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [newProductBarcode, setNewProductBarcode] = useState('');
  const [newProductData, setNewProductData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    sku: '',
    cost_price: '',
    gst_rate: '18',
    unit: 'pcs'
  });
  const [addingProduct, setAddingProduct] = useState(false);

  const isMobile = /mobile|android|iphone|ipad/i.test(navigator.userAgent);
  const deviceSource = isMobile ? 'mobile' : 'desktop';

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/inventory/products`, { params: { search, limit: 50 }, withCredentials: true });
      setProducts(data.products);
    } catch {}
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const searchCustomers = useCallback(async () => {
    if (!customerSearch) return;
    try {
      const { data } = await axios.get(`${API}/customers?search=${customerSearch}`, { withCredentials: true });
      setCustomers(data.customers || []);
    } catch {}
  }, [customerSearch]);

  useEffect(() => { if (customerSearch.length >= 2) searchCustomers(); }, [customerSearch, searchCustomers]);

  const selectCustomer = (c) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone || '');
    setShowCustomerPicker(false);
    setCustomerSearch('');
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) { toast.error('Insufficient stock'); return prev; }
        return prev.map(c => c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      if (product.stock <= 0) { toast.error('Out of stock'); return prev; }
      return [...prev, { product_id: product.id, name: product.name, quantity: 1, price: product.price, gst_rate: product.gst_rate || 0, stock: product.stock }];
    });
  };

  const updateQty = (pid, delta) => {
    setCart(prev => prev.map(c => {
      if (c.product_id !== pid) return c;
      const newQty = c.quantity + delta;
      if (newQty <= 0) return null;
      if (newQty > c.stock) { toast.error('Insufficient stock'); return c; }
      return { ...c, quantity: newQty };
    }).filter(Boolean));
  };

  const removeFromCart = (pid) => setCart(prev => prev.filter(c => c.product_id !== pid));

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const taxTotal = cart.reduce((sum, c) => sum + (c.price * c.quantity * c.gst_rate / 100), 0);
  const totalDiscount = (parseFloat(discount) || 0) + promoDiscount;
  const grandTotal = subtotal + taxTotal - totalDiscount;

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    setProcessing(true);
    try {
      const { data } = await axios.post(`${API}/pos/invoice`, {
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_id: customerId || null,
        items: cart.map(c => ({ product_id: c.product_id, name: c.name, quantity: c.quantity, price: c.price, gst_rate: c.gst_rate })),
        discount: totalDiscount,
        payment_method: paymentMethod,
        device_source: deviceSource,
        promo_code: appliedPromo?.code || null
      }, { withCredentials: true });
      setLastInvoice(data);
      setCart([]);
      setDiscount('');
      setPromoCode('');
      setPromoDiscount(0);
      setAppliedPromo(null);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setCustomerId('');
      fetchProducts();
      toast.success(`Invoice ${data.invoice_number} created!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBarcodeScan = useCallback((barcode, product) => {
    if (product) {
      addToCart(product);
    } else {
      setSearch(barcode);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    if (cart.length === 0) {
      toast.error('Add items to cart first');
      return;
    }
    
    setValidatingPromo(true);
    try {
      const orderAmount = subtotal + taxTotal;
      const { data } = await axios.post(`${API}/promo-codes/validate`, {
        code: promoCode.trim().toUpperCase(),
        order_amount: orderAmount
      }, { withCredentials: true });
      
      setPromoDiscount(data.discount_amount);
      setAppliedPromo(data);
      toast.success(`Promo applied! ₹${data.discount_amount.toFixed(2)} discount`);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid promo code';
      toast.error(msg);
      setPromoDiscount(0);
      setAppliedPromo(null);
    } finally {
      setValidatingPromo(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode('');
    setPromoDiscount(0);
    setAppliedPromo(null);
    toast.info('Promo code removed');
  };

  const [posLookupInfo, setPosLookupInfo] = useState(null);
  const [posLookingUp, setPosLookingUp] = useState(false);

  const handleBarcodeNotFound = async (barcode) => {
    setNewProductBarcode(barcode);
    setNewProductData({
      name: '',
      price: '',
      stock: '',
      category: '',
      sku: barcode,
      cost_price: '',
      gst_rate: '18',
      unit: 'pcs'
    });
    setShowAddProductDialog(true);
    setPosLookupInfo(null);

    // Try external barcode lookup
    setPosLookingUp(true);
    try {
      const { data } = await axios.get(`${API}/inventory/barcode-lookup/${barcode}`, { withCredentials: true });
      if (data.found && data.product_info) {
        const info = data.product_info;
        const cleanCategory = (info.category || '').split('>').pop()?.trim() || info.category || '';
        setNewProductData(prev => ({
          ...prev,
          name: info.name || prev.name || '',
          category: cleanCategory || prev.category || '',
          sku: barcode,
        }));
        setPosLookupInfo({ source: data.source, brand: info.brand, weight: info.weight, priceHint: info.price_hint });
        toast.success(`Product info found! Review and set your price & stock.`);
      } else {
        toast.info(`Barcode not found in databases. Enter details manually.`);
      }
    } catch {
      // Silently fail — user can still enter manually
    } finally {
      setPosLookingUp(false);
    }
  };

  const handleAddNewProduct = async () => {
    if (!newProductData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!newProductData.price || parseFloat(newProductData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }
    if (!newProductData.stock || parseInt(newProductData.stock) < 0) {
      toast.error('Valid stock quantity is required');
      return;
    }

    setAddingProduct(true);
    try {
      const payload = {
        name: newProductData.name.trim(),
        barcode: newProductBarcode,
        sku: newProductData.sku.trim() || newProductBarcode,
        category: newProductData.category.trim() || 'General',
        price: parseFloat(newProductData.price),
        cost_price: parseFloat(newProductData.cost_price) || 0,
        stock: parseInt(newProductData.stock),
        gst_rate: parseFloat(newProductData.gst_rate) || 0,
        unit: newProductData.unit || 'pcs',
        low_stock_threshold: 10
      };

      const { data } = await axios.post(`${API}/inventory/products`, payload, { withCredentials: true });
      
      // Add the newly created product to cart
      addToCart(data);
      
      // Refresh product list
      fetchProducts();
      
      toast.success(`Product "${data.name}" added to inventory and cart!`);
      setShowAddProductDialog(false);
      setNewProductBarcode('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add product');
    } finally {
      setAddingProduct(false);
    }
  };

  const printInvoice = async (invoiceId) => {
    try {
      const res = await fetch(`${API}/pos/invoices/${invoiceId}/pdf`, { credentials: 'include' });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) { win.onload = () => win.print(); }
    } catch { toast.error('Failed to generate PDF'); }
  };

  const downloadPDF = async (invoiceId) => {
    try {
      const res = await fetch(`${API}/pos/invoices/${invoiceId}/pdf`, { credentials: 'include' });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `invoice-${invoiceId}.pdf`; a.click();
    } catch { toast.error('Failed to download PDF'); }
  };

  // ── Share Digital Receipt ──
  const shareReceipt = async (invoiceId) => {
    try {
      const { data } = await axios.get(`${API}/invoices/${invoiceId}/digital-receipt`, { withCredentials: true });
      setReceiptData(data);
      setSharePhone(customerPhone || '');
      setShowShareReceipt(true);
    } catch { toast.error('Failed to generate receipt'); }
  };

  const sendReceipt = async () => {
    if (!receiptData) return;
    try {
      const { data } = await axios.post(`${API}/invoices/${lastInvoice.id}/send-receipt`, {
        phone: sharePhone.trim(),
        channel: 'whatsapp'
      }, { withCredentials: true });
      if (data.whatsapp_link && sharePhone) {
        window.open(data.whatsapp_link, '_blank');
      }
      toast.success('Receipt link ready!');
    } catch { toast.error('Failed'); }
  };

  const copyReceiptLink = () => {
    if (receiptData?.share_url) {
      navigator.clipboard.writeText(receiptData.share_url);
      toast.success('Receipt link copied!');
    }
  };

  // ── Smart Substitution ──
  const findSubstitutes = async (product) => {
    setAiSubstituting(true);
    setSubstitutes(null);
    setShowSubstitutes(true);
    try {
      const { data } = await axios.post(`${API}/products/ai-substitute`, {
        product_id: product.id,
        product_name: product.name
      }, { withCredentials: true });
      setSubstitutes(data);
    } catch {
      // Fallback to simple category match
      try {
        const { data } = await axios.get(`${API}/products/${product.id}/substitutes`, { withCredentials: true });
        setSubstitutes({
          suggestions: data.substitutes.slice(0, 3).map(s => ({
            product_id: s.id, name: s.name,
            reason: `Same category, ₹${Math.abs(s.price_diff)} ${s.price_diff > 0 ? 'higher' : 'lower'} price`,
            confidence: 0.7
          })),
          customer_message: `We have some alternatives available for ${product.name}.`,
          _products: data.substitutes
        });
      } catch { toast.error('No substitutes found'); }
    } finally {
      setAiSubstituting(false);
    }
  };

  const addSubstituteToCart = (sub) => {
    // Find the product in our products list or use the data from substitutes
    const product = products.find(p => p.id === sub.product_id) || substitutes?._products?.find(p => p.id === sub.product_id);
    if (product) {
      addToCart(product);
      setShowSubstitutes(false);
      toast.success(`Added ${sub.name} to cart`);
    } else {
      toast.error('Product not available');
    }
  };

  return (
    <div data-testid="pos-page" className="flex h-full">
      {/* Left: Product Search & Grid */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                ref={searchRef}
                data-testid="pos-search-input"
                placeholder="Search by name, SKU, or barcode..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                autoFocus
              />
            </div>
            <ScanFromPhoneButton type="pos" onBarcodeScan={handleBarcodeScan} />
          </div>
          <BarcodeInput
            onBarcodeScan={async (barcode) => {
              const found = products.find(p => p.barcode === barcode);
              if (found) { 
                addToCart(found); 
              } else { 
                // Check if product exists in database
                try {
                  const { data } = await axios.get(`${API}/inventory/products`, { 
                    params: { search: barcode, limit: 1 }, 
                    withCredentials: true 
                  });
                  if (data.products && data.products.length > 0 && data.products[0].barcode === barcode) {
                    addToCart(data.products[0]);
                  } else {
                    // Product not found - show add dialog
                    handleBarcodeNotFound(barcode);
                  }
                } catch (err) {
                  handleBarcodeNotFound(barcode);
                }
              }
            }}
            placeholder="Scan or type barcode to add to cart..."
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4 dark:bg-slate-900">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map(p => (
              <button
                key={p.id}
                data-testid={`pos-product-${p.id}`}
                onClick={() => p.stock > 0 ? addToCart(p) : findSubstitutes(p)}
                className={`text-left p-3 rounded-md border transition-all duration-150 ${
                  p.stock <= 0 ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 cursor-pointer hover:border-orange-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md active:scale-[0.98]'
                }`}
              >
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{p.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.barcode ? `${p.barcode}` : p.sku || p.category || ''}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">₹{p.price?.toFixed(2)}</span>
                  {p.stock <= 0 ? (
                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-0.5">
                      <Sparkles className="h-3 w-3" /> Find Alt
                    </span>
                  ) : (
                    <Badge variant={p.stock <= (p.low_stock_threshold || 10) ? 'destructive' : 'secondary'} className="text-xs">
                      {p.stock} {p.unit}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
            {products.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-400 dark:text-slate-500">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3" />
                <p>No products found. Add products in Inventory.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-96 flex flex-col bg-white dark:bg-slate-800">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-heading font-semibold text-lg flex items-center gap-2 dark:text-white">
            <Receipt className="h-5 w-5 text-blue-600" />
            Current Sale
            <Badge variant="outline" className="ml-auto text-xs">{deviceSource}</Badge>
          </h2>
        </div>

        <div className="p-4 space-y-3 border-b border-slate-200 dark:border-slate-700">
          <div className="space-y-1.5">
            <Label className="text-xs dark:text-slate-300">Customer</Label>
            <div className="flex gap-1">
              <Input data-testid="pos-customer-name" value={customerName} onChange={e => { setCustomerName(e.target.value); setCustomerId(''); }} className="h-8 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              <Button variant="outline" size="sm" className="h-8 text-xs px-2 dark:border-slate-600" onClick={() => setShowCustomerPicker(!showCustomerPicker)}>Pick</Button>
            </div>
            {showCustomerPicker && (
              <div className="border rounded-md p-2 bg-slate-50 dark:bg-slate-700 dark:border-slate-600 space-y-2">
                <Input placeholder="Search customers..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="h-7 text-xs dark:bg-slate-600 dark:border-slate-500 dark:text-white" />
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {customers.map(c => (
                    <button key={c.id} onClick={() => selectCustomer(c)} className="w-full text-left p-1.5 rounded text-xs hover:bg-blue-50 dark:hover:bg-slate-600 dark:text-white">
                      <span className="font-medium">{c.name}</span> <span className="text-slate-400">{c.phone}</span>
                      {c.credit_balance > 0 && <span className="text-red-500 ml-1">Cr: ₹{c.credit_balance.toFixed(2)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs dark:text-slate-300">Phone</Label>
            <Input data-testid="pos-customer-phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-8 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : cart.map(item => (
            <div 
              key={item.product_id} 
              className={`flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700 ${borderStyles.colorClass}`}
              style={{
                borderRadius: borderStyles.borderRadius,
                borderWidth: borderStyles.borderWidth,
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">₹{item.price.toFixed(2)} x {item.quantity}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-6 w-6 dark:border-slate-500" onClick={() => updateQty(item.product_id, -1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium tabular-nums dark:text-white">{item.quantity}</span>
                <Button variant="outline" size="icon" className="h-6 w-6 dark:border-slate-500" onClick={() => updateQty(item.product_id, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeFromCart(item.product_id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <span className="text-sm font-semibold tabular-nums w-16 text-right dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs dark:text-slate-300">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger data-testid="pos-payment-method" className="h-8 text-sm dark:bg-slate-700 dark:border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash"><span className="flex items-center gap-2"><Banknote className="h-3.5 w-3.5" /> Cash</span></SelectItem>
                <SelectItem value="card"><span className="flex items-center gap-2"><CreditCard className="h-3.5 w-3.5" /> Card</span></SelectItem>
                <SelectItem value="upi"><span className="flex items-center gap-2">UPI</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs dark:text-slate-300 flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Promo Code
            </Label>
            <div className="flex gap-1">
              <Input
                data-testid="pos-promo-code"
                placeholder="Enter code..."
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                disabled={!!appliedPromo}
                className="h-8 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white uppercase"
                onKeyDown={e => e.key === 'Enter' && !appliedPromo && validatePromoCode()}
              />
              {appliedPromo ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs px-2 dark:border-slate-600"
                  onClick={removePromoCode}
                >
                  Remove
                </Button>
              ) : (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-8 text-xs px-3 bg-green-600 hover:bg-green-700"
                  onClick={validatePromoCode}
                  disabled={validatingPromo || !promoCode.trim()}
                >
                  {validatingPromo ? 'Checking...' : 'Apply'}
                </Button>
              )}
            </div>
            {appliedPromo && (
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                ✓ {appliedPromo.discount_type === 'percentage' ? `${appliedPromo.discount_value}%` : `₹${appliedPromo.discount_value}`} discount applied
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs dark:text-slate-300">Manual Discount (₹)</Label>
            <Input data-testid="pos-discount" type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} onFocus={e => e.target.select()} placeholder="0.00" className="h-8 text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>

          <Separator className="dark:border-slate-600" />

          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Subtotal</span><span className="tabular-nums">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-300">
              <span>Tax (GST)</span><span className="tabular-nums">₹{taxTotal.toFixed(2)}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Promo Discount</span><span className="tabular-nums">-₹{promoDiscount.toFixed(2)}</span>
              </div>
            )}
            {(parseFloat(discount) || 0) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Manual Discount</span><span className="tabular-nums">-₹{(parseFloat(discount) || 0).toFixed(2)}</span>
              </div>
            )}
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Total Discount</span><span className="tabular-nums">-₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <Separator className="dark:border-slate-600" />
            <div className="flex justify-between font-bold text-lg dark:text-white">
              <span>Total</span><span className="tabular-nums">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button
            data-testid="pos-checkout-btn"
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
          >
            {processing ? 'Processing...' : `Checkout ₹${grandTotal.toFixed(2)}`}
          </Button>
        </div>

        {lastInvoice && (
          <div className="border-t border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3">
            <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-2">Last Invoice: {lastInvoice.invoice_number} - ₹{lastInvoice.grand_total?.toFixed(2)}</p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => printInvoice(lastInvoice.id)}>
                <Printer className="h-3 w-3 mr-1" /> Print
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => downloadPDF(lastInvoice.id)}>
                <Download className="h-3 w-3 mr-1" /> PDF
              </Button>
              <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700 text-white" onClick={() => shareReceipt(lastInvoice.id)}>
                <Share2 className="h-3 w-3 mr-1" /> Share Receipt
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add New Product Dialog */}
      <Dialog open={showAddProductDialog} onOpenChange={(open) => { setShowAddProductDialog(open); if (!open) setPosLookupInfo(null); }}>
        <DialogContent className="sm:max-w-[500px] dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <PackagePlus className="h-5 w-5 text-blue-600" />
              Add New Product
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Product with barcode <strong className="text-slate-900 dark:text-white">{newProductBarcode}</strong> not found. Add it to inventory?
            </DialogDescription>
          </DialogHeader>

          {/* Barcode Lookup Info Banner */}
          {posLookupInfo && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Product info auto-filled from barcode database
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Review and edit. Set your own price & stock.</p>
              {posLookupInfo.brand && <p className="text-xs text-blue-700 dark:text-blue-300"><strong>Brand:</strong> {posLookupInfo.brand}</p>}
              {posLookupInfo.weight && <p className="text-xs text-blue-700 dark:text-blue-300"><strong>Weight:</strong> {posLookupInfo.weight}</p>}
              {posLookupInfo.priceHint && <p className="text-xs text-blue-700 dark:text-blue-300"><strong>Ref. Price:</strong> ₹{posLookupInfo.priceHint} (set your own below)</p>}
            </div>
          )}

          {posLookingUp && (
            <div className="flex items-center justify-center py-2 gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
              <span className="text-xs text-slate-500">Looking up barcode...</span>
            </div>
          )}
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm dark:text-slate-300">Product Name *</Label>
                <Input
                  placeholder="e.g., Coca Cola 500ml"
                  value={newProductData.name}
                  onChange={e => setNewProductData(prev => ({ ...prev, name: e.target.value }))}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm dark:text-slate-300">Category</Label>
                <Input
                  placeholder="e.g., Beverages"
                  value={newProductData.category}
                  onChange={e => setNewProductData(prev => ({ ...prev, category: e.target.value }))}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-sm dark:text-slate-300">Price (₹) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="50.00"
                  value={newProductData.price}
                  onChange={e => setNewProductData(prev => ({ ...prev, price: e.target.value }))}
                  onFocus={e => e.target.select()}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm dark:text-slate-300">Stock Qty *</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="100"
                  value={newProductData.stock}
                  onChange={e => setNewProductData(prev => ({ ...prev, stock: e.target.value }))}
                  onFocus={e => e.target.select()}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm dark:text-slate-300">Unit</Label>
                <Select 
                  value={newProductData.unit} 
                  onValueChange={val => setNewProductData(prev => ({ ...prev, unit: val }))}
                >
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">pcs</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="ltr">ltr</SelectItem>
                    <SelectItem value="box">box</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-sm dark:text-slate-300">Cost Price (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="30.00"
                  value={newProductData.cost_price}
                  onChange={e => setNewProductData(prev => ({ ...prev, cost_price: e.target.value }))}
                  onFocus={e => e.target.select()}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm dark:text-slate-300">GST Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="18"
                  value={newProductData.gst_rate}
                  onChange={e => setNewProductData(prev => ({ ...prev, gst_rate: e.target.value }))}
                  onFocus={e => e.target.select()}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm dark:text-slate-300">SKU</Label>
                <Input
                  placeholder="Auto-filled"
                  value={newProductData.sku}
                  onChange={e => setNewProductData(prev => ({ ...prev, sku: e.target.value }))}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddProductDialog(false)}
              disabled={addingProduct}
              className="dark:border-slate-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddNewProduct}
              disabled={addingProduct}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {addingProduct ? 'Adding...' : 'Add to Inventory & Cart'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Digital Receipt Dialog */}
      <Dialog open={showShareReceipt} onOpenChange={setShowShareReceipt}>
        <DialogContent className="max-w-md dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <Share2 className="h-5 w-5 text-green-600" /> Share Digital Receipt
            </DialogTitle>
          </DialogHeader>
          {receiptData && (
            <div className="space-y-4 py-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{receiptData.shop_name}</p>
                    <p className="text-blue-100 text-xs">#{receiptData.invoice?.invoice_number}</p>
                  </div>
                  <p className="text-xl font-bold">₹{receiptData.invoice?.grand_total?.toFixed(2)}</p>
                </div>
                <div className="mt-2 text-xs text-blue-200">
                  {receiptData.invoice?.items?.length} items • {receiptData.loyalty_points} loyalty points earned ⭐
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-slate-300">Customer Phone (for WhatsApp)</label>
                <Input
                  value={sharePhone}
                  onChange={(e) => setSharePhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={sendReceipt}>
                  <MessageCircle className="h-4 w-4 mr-1" /> Send via WhatsApp
                </Button>
                <Button variant="outline" onClick={copyReceiptLink} className="dark:border-slate-600 dark:text-slate-300">
                  <Copy className="h-4 w-4 mr-1" /> Copy Link
                </Button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">{receiptData.branding?.footer}</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mt-1">{receiptData.branding?.logo_text}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Smart Substitution Dialog */}
      <Dialog open={showSubstitutes} onOpenChange={setShowSubstitutes}>
        <DialogContent className="max-w-lg dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" /> Smart Substitutes
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {aiSubstituting ? (
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-500 border-t-transparent" />
                <span className="text-sm text-slate-500 dark:text-slate-400">AI is finding the best alternatives...</span>
              </div>
            ) : substitutes ? (
              <>
                {substitutes.customer_message && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">{substitutes.customer_message}</p>
                  </div>
                )}
                <div className="space-y-2">
                  {(substitutes.suggestions || []).map((sub, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                      <div className="flex-1">
                        <p className="font-medium text-sm dark:text-white">{sub.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub.reason}</p>
                        {sub.confidence && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 rounded-full" style={{ width: `${sub.confidence * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-400">{Math.round(sub.confidence * 100)}% match</span>
                          </div>
                        )}
                      </div>
                      <Button size="sm" className="ml-3 bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={() => addSubstituteToCart(sub)}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </Button>
                    </div>
                  ))}
                  {(substitutes.suggestions || []).length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No substitutes found in stock</p>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
