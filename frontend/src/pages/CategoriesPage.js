import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FolderTree, Plus, Edit2, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function CategoriesPage() {
  const { user } = useAuth();
  const [flatCategories, setFlatCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [formName, setFormName] = useState('');
  const [formParent, setFormParent] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSort, setFormSort] = useState(0);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(API + '/api/categories?flat=true', { credentials: 'include' });
      const data = await res.json();
      setFlatCategories(data.categories || []);
    } catch (err) {
      toast.error('Failed to load categories');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openNewForm = () => {
    setEditCat(null);
    setFormName(''); setFormParent(''); setFormDesc(''); setFormSort(0);
    setShowForm(true);
  };

  const openEditForm = (cat) => {
    setEditCat(cat);
    setFormName(cat.name); setFormParent(cat.parent_id || ''); setFormDesc(cat.description || ''); setFormSort(cat.sort_order || 0);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditCat(null); };

  const handleSave = async () => {
    try {
      const url = editCat ? (API + '/api/categories/' + editCat.id) : (API + '/api/categories');
      const payload = { name: formName, description: formDesc, sort_order: formSort };
      if (formParent) payload.parent_id = formParent;
      const res = await fetch(url, {
        method: editCat ? 'PUT' : 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      toast.success(editCat ? 'Category updated' : 'Category created');
      closeForm();
      fetchCategories();
    } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await fetch(API + '/api/categories/' + id, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail); }
      toast.success('Category deleted');
      fetchCategories();
    } catch (e) { toast.error(e.message); }
  };

  const totalProducts = flatCategories.reduce((sum, c) => sum + (c.product_count || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="categories-loading">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const parentOptions = flatCategories.filter((c) => !editCat || c.id !== editCat.id);
  const catMap = {};
  flatCategories.forEach(c => { catMap[c.id] = c.name; });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" data-testid="categories-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="h-7 w-7 text-amber-500" /> Category Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{flatCategories.length} categories, {totalProducts} products</p>
        </div>
        {user && user.role !== 'STAFF' && (
          <Button data-testid="add-category-btn" onClick={openNewForm}>
            <Plus className="h-4 w-4 mr-1" /> Add Category
          </Button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="category-form-modal">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-heading font-bold text-slate-900 dark:text-white mb-4">
              {editCat ? 'Edit Category' : 'New Category'}
            </h2>
            <div className="space-y-3">
              <input data-testid="category-name-input" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Category Name *" value={formName} onChange={(e) => setFormName(e.target.value)} />
              <select data-testid="category-parent-select" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formParent} onChange={(e) => setFormParent(e.target.value)}>
                <option value="">No Parent (Root Category)</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>{'--'.repeat(c.level || 0)} {c.name}</option>
                ))}
              </select>
              <textarea data-testid="category-desc-input" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Description (optional)" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} />
              <input data-testid="category-sort-input" type="number" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Sort Order" value={formSort} onChange={(e) => setFormSort(parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <Button variant="outline" onClick={closeForm}>Cancel</Button>
              <Button data-testid="save-category-btn" onClick={handleSave} disabled={!formName}>Save</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden" data-testid="category-tree">
        {flatCategories.length === 0 ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">
            <FolderTree className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">No categories yet</p>
            <p className="text-sm">Create categories to organize your products</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {flatCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 py-2.5 px-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group" style={{ paddingLeft: ((cat.level || 0) * 24 + 12) + 'px' }} data-testid={'category-node-' + cat.id}>
                <Package className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{cat.name}</span>
                {cat.parent_id && catMap[cat.parent_id] && (
                  <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">in {catMap[cat.parent_id]}</span>
                )}
                <span className="text-xs text-slate-400 tabular-nums">{cat.product_count || 0} items</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => openEditForm(cat)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded" data-testid={'edit-cat-' + cat.id}>
                    <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded" data-testid={'delete-cat-' + cat.id}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
