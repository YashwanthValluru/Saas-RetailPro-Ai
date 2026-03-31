import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Barcode, Printer, Search, Check, X, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function BarcodePrintPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState({});
  const [labelSize, setLabelSize] = useState('medium');
  const [copies, setCopies] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/inventory?limit=500`, { credentials: 'include' });
      const data = await res.json();
      setProducts(data.products || []);
    } catch { toast.error('Failed to load products'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const n = { ...prev };
      if (n[id]) delete n[id]; else n[id] = true;
      return n;
    });
  };

  const selectAll = () => {
    const filtered = filteredProducts;
    const allSelected = filtered.every(p => selected[p.id]);
    if (allSelected) {
      setSelected({});
    } else {
      const sel = {};
      filtered.forEach(p => sel[p.id] = true);
      setSelected(sel);
    }
  };

  const generateLabels = async () => {
    const ids = Object.keys(selected);
    if (!ids.length) { toast.error('Select at least one product'); return; }
    setGenerating(true);
    try {
      const res = await fetch(`${API}/api/inventory/barcode-labels`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_ids: ids, label_size: labelSize, copies })
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // Open in new tab for printing
      const w = window.open(url, '_blank');
      if (w) w.print();
      toast.success(`${ids.length * copies} labels generated`);
    } catch (e) { toast.error(e.message); }
    setGenerating(false);
  };

  const filteredProducts = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  const selectedCount = Object.keys(selected).length;

  if (loading) return <div className="flex items-center justify-center h-64" data-testid="barcode-loading"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="barcode-print-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Barcode className="h-7 w-7 text-violet-600" /> Barcode Label Printer
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Select products and print barcode labels</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input data-testid="barcode-search" className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Size:</span>
            {['small', 'medium', 'large'].map(sz => (
              <button key={sz} data-testid={`size-${sz}`} className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${labelSize === sz ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`} onClick={() => setLabelSize(sz)}>
                {sz.charAt(0).toUpperCase() + sz.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Copies:</span>
            <button onClick={() => setCopies(Math.max(1, copies - 1))} className="p-1 rounded border dark:border-slate-600"><Minus className="h-4 w-4" /></button>
            <span className="w-8 text-center font-mono text-sm" data-testid="copy-count">{copies}</span>
            <button onClick={() => setCopies(Math.min(10, copies + 1))} className="p-1 rounded border dark:border-slate-600"><Plus className="h-4 w-4" /></button>
          </div>
          <Button data-testid="print-labels-btn" onClick={generateLabels} disabled={!selectedCount || generating} className="bg-violet-600 hover:bg-violet-700">
            <Printer className="h-4 w-4 mr-1" /> Print {selectedCount > 0 ? `(${selectedCount * copies})` : ''}
          </Button>
        </div>
      </div>

      {/* Product Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedCount} of {filteredProducts.length} selected</span>
          <Button variant="ghost" size="sm" onClick={selectAll} data-testid="select-all-btn">
            {filteredProducts.every(p => selected[p.id]) ? 'Deselect All' : 'Select All'}
          </Button>
        </div>
        <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
          {filteredProducts.map(p => (
            <div key={p.id} data-testid={`product-row-${p.id}`} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selected[p.id] ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`} onClick={() => toggleSelect(p.id)}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selected[p.id] ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {selected[p.id] && <Check className="h-3.5 w-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{p.name}</p>
                <p className="text-xs text-slate-500">{p.sku || 'No SKU'} &middot; {p.barcode || 'No barcode'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">₹{p.price?.toFixed(2)}</p>
                <p className="text-xs text-slate-500">Stock: {p.stock}</p>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-slate-400"><p>No products found</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
