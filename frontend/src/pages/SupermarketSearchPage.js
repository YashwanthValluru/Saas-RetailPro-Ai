import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Package, FolderTree, ChevronRight, Filter, SortAsc, SortDesc, Building2, Eye, ArrowRightLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function SupermarketSearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({ categories: [], products: [] });
  const [results, setResults] = useState(null);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [availability, setAvailability] = useState(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(API + '/api/categories?flat=true', { credentials: 'include' });
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {}
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await fetch(API + '/api/branches', { credentials: 'include' });
      const data = await res.json();
      setBranches(data.branches || []);
    } catch {}
  }, []);

  useEffect(() => { fetchCategories(); fetchBranches(); }, [fetchCategories, fetchBranches]);

  const searchProducts = useCallback(async (resetPage) => {
    setLoading(true);
    const p = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    try {
      const params = new URLSearchParams({ q: query, page: p, limit: 50, sort_by: sortBy, sort_dir: sortDir });
      if (selectedCategory) params.set('category_id', selectedCategory);
      if (selectedBranch) params.set('branch_id', selectedBranch);
      const res = await fetch(API + '/api/search/products?' + params.toString(), { credentials: 'include' });
      const data = await res.json();
      setResults(data);
    } catch { toast.error('Search failed'); }
    setLoading(false);
  }, [query, selectedCategory, selectedBranch, sortBy, sortDir, page]);

  useEffect(() => { searchProducts(false); }, [page, sortBy, sortDir]);

  const handleQueryChange = (val) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(API + '/api/search/suggestions?q=' + encodeURIComponent(val), { credentials: 'include' });
          const data = await res.json();
          setSuggestions(data);
          setShowSuggestions(true);
        } catch {}
      }, 300);
    } else {
      setSuggestions({ categories: [], products: [] });
      setShowSuggestions(false);
    }
  };

  const selectCategory = async (catId) => {
    setSelectedCategory(catId);
    setShowSuggestions(false);
    if (catId) {
      try {
        const res = await fetch(API + '/api/categories/breadcrumb/' + catId, { credentials: 'include' });
        const data = await res.json();
        setBreadcrumb(data.breadcrumb || []);
      } catch { setBreadcrumb([]); }
    } else {
      setBreadcrumb([]);
    }
    setTimeout(() => searchProducts(true), 100);
  };

  const checkAvailability = async (productId) => {
    try {
      const res = await fetch(API + '/api/inventory/cross-branch/' + productId, { credentials: 'include' });
      const data = await res.json();
      setAvailability(data);
    } catch { toast.error('Failed to check availability'); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    searchProducts(true);
  };

  const catMap = {};
  categories.forEach(c => { catMap[c.id] = c; });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5" data-testid="supermarket-search-page">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Search className="h-7 w-7 text-blue-600" /> Product Search
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Search across all products, categories, and branches</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative" ref={searchRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              data-testid="global-search-input"
              className="w-full pl-12 pr-4 py-3 text-lg border-2 border-slate-200 dark:border-slate-600 rounded-xl dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all"
              placeholder="Search products, SKUs, barcodes..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            />
          </div>
          <Button type="submit" className="px-6 py-3 text-lg" data-testid="search-btn">Search</Button>
        </div>

        {/* Auto-suggestions dropdown */}
        {showSuggestions && (suggestions.categories.length > 0 || suggestions.products.length > 0) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto" data-testid="suggestions-dropdown">
            {suggestions.categories.length > 0 && (
              <div className="p-2">
                <p className="text-xs font-medium text-slate-400 px-2 mb-1">CATEGORIES</p>
                {suggestions.categories.map((c, i) => (
                  <button key={i} className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center gap-2" onClick={() => { selectCategory(c.id); setQuery(''); }} data-testid={'suggest-cat-' + i}>
                    <FolderTree className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-slate-800 dark:text-slate-200">{c.name}</span>
                    {c.level > 0 && <span className="text-xs text-slate-400">Level {c.level}</span>}
                  </button>
                ))}
              </div>
            )}
            {suggestions.products.length > 0 && (
              <div className="p-2 border-t dark:border-slate-700">
                <p className="text-xs font-medium text-slate-400 px-2 mb-1">PRODUCTS</p>
                {suggestions.products.map((p, i) => (
                  <button key={i} className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg flex items-center justify-between" onClick={() => { setQuery(p.name); setShowSuggestions(false); searchProducts(true); }} data-testid={'suggest-prod-' + i}>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-slate-800 dark:text-slate-200">{p.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 tabular-nums">Rs.{p.price} | Stock: {p.stock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </form>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select data-testid="filter-category" className="px-3 py-1.5 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={selectedCategory} onChange={(e) => selectCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{'--'.repeat(c.level || 0)} {c.name}</option>
            ))}
          </select>
          <select data-testid="filter-branch" className="px-3 py-1.5 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={selectedBranch} onChange={(e) => { setSelectedBranch(e.target.value); setTimeout(() => searchProducts(true), 100); }}>
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <select className="px-3 py-1.5 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
            <option value="category">Category</option>
          </select>
          <button onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')} className="p-1.5 border rounded-lg dark:border-slate-600" data-testid="sort-dir-btn">
            {sortDir === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <div className="flex items-center gap-1 text-sm" data-testid="category-breadcrumb">
          <button onClick={() => selectCategory('')} className="text-blue-600 hover:underline">All</button>
          {breadcrumb.map((b, i) => (
            <React.Fragment key={b.id}>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <button onClick={() => selectCategory(b.id)} className="text-blue-600 hover:underline">{b.name}</button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-4" data-testid="search-results">
          <p className="text-sm text-slate-500">{results.total} products found {results.query && ('for "' + results.query + '"')}</p>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                    <th className="px-4 py-3">Product</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Branch</th><th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {results.products?.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30" data-testid={'result-row-' + p.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                        {p.barcode && <p className="text-xs text-slate-400 font-mono">{p.barcode}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.sku || '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{p.category || '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{p.branch_name || '-'}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">Rs.{p.price?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={'font-medium tabular-nums ' + (p.stock <= 0 ? 'text-red-500' : p.stock <= (p.low_stock_threshold || 10) ? 'text-amber-500' : 'text-green-600')}>{p.stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => checkAvailability(p.id)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded text-blue-600" title="Check availability" data-testid={'check-avail-' + p.id}>
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {results.pages > 1 && (
              <div className="flex justify-center items-center gap-2 p-4 border-t dark:border-slate-700">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
                <span className="text-sm text-slate-500">Page {page} of {results.pages}</span>
                <Button variant="outline" size="sm" disabled={page >= results.pages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Availability Modal */}
      {availability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="availability-modal">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" /> Branch Availability
              </h2>
              <button onClick={() => setAvailability(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-3">{availability.product_name}</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white mb-4">Total Stock: {availability.total_stock_all_branches}</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availability.branches?.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" data-testid={'avail-branch-' + i}>
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{b.branch_name || 'Unassigned'}</p>
                    {b.branch_address && <p className="text-xs text-slate-400">{b.branch_address}</p>}
                  </div>
                  <span className={'text-lg font-bold tabular-nums ' + (b.stock > 0 ? 'text-green-600' : 'text-red-500')}>{b.stock}</span>
                </div>
              ))}
            </div>
            {availability.branches?.some(b => b.stock > 0) && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">Use Transfer Requests to move stock between branches</p>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
