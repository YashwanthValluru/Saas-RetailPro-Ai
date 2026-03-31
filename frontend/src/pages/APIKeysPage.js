import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Copy, Key, X, Shield } from 'lucide-react';

const API = '';

export default function APIKeysPage() {
  const [keys, setKeys] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [form, setForm] = useState({ name: '', permissions: ['read_inventory', 'read_invoices'] });
  const allPermissions = ['read_inventory', 'read_invoices', 'read_customers', 'read_reports', 'write_inventory', 'create_invoice'];

  const fetchKeys = async () => {
    try {
      const res = await fetch(`${API}/api/admin/api-keys`, { credentials: 'include' });
      const data = await res.json();
      setKeys(data.api_keys || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/admin/api-keys`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(form)
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail); }
      const data = await res.json();
      setNewKey(data.api_key);
      toast.success('API key created');
      fetchKeys();
      setShowForm(false);
    } catch (e) { toast.error(e.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Revoke this API key?')) return;
    try {
      await fetch(`${API}/api/admin/api-keys/${id}`, { method: 'DELETE', credentials: 'include' });
      toast.success('API key revoked');
      fetchKeys();
    } catch (e) { toast.error('Failed'); }
  };

  const togglePerm = (p) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(p) ? prev.permissions.filter(x => x !== p) : [...prev.permissions, p]
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API Keys</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage external API access to your store data</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm"><Plus className="h-4 w-4 mr-1" />Create Key</Button>
      </div>

      {newKey && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">New API Key Created — Copy it now, it won't be shown again!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-slate-800 p-2 rounded text-sm font-mono break-all border dark:border-slate-600 dark:text-green-300">{newKey}</code>
              <Button size="sm" onClick={() => { navigator.clipboard.writeText(newKey); toast.success('Copied!'); }}><Copy className="h-4 w-4" /></Button>
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setNewKey(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-base dark:text-white">Usage</CardTitle>
          <CardDescription className="dark:text-slate-400">Include <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">X-API-Key: your_key</code> header in requests to <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">/api/external/*</code> endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xs font-mono bg-slate-50 dark:bg-slate-900 p-3 rounded space-y-1 dark:text-slate-300">
            <p>GET /api/external/inventory</p>
            <p>GET /api/external/invoices</p>
            <p>GET /api/external/customers</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {keys.map(k => (
          <Card key={k.id} className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-slate-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">{k.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${k.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{k.is_active ? 'Active' : 'Revoked'}</span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">{k.key_prefix}</p>
                <div className="flex gap-1 mt-1">
                  {(k.permissions || []).map(p => <span key={p} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">{p}</span>)}
                </div>
                {k.last_used && <p className="text-xs text-slate-400 mt-1">Last used: {new Date(k.last_used).toLocaleString()}</p>}
              </div>
              {k.is_active && <Button variant="ghost" size="sm" onClick={() => handleDelete(k.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>}
            </CardContent>
          </Card>
        ))}
        {keys.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 py-8">No API keys created yet</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">Create API Key</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
                <Input placeholder="Key name (e.g., Mobile App)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Permissions</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {allPermissions.map(p => (
                      <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={form.permissions.includes(p)} onChange={() => togglePerm(p)} className="rounded" />
                        <span className="text-slate-600 dark:text-slate-300">{p.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full"><Shield className="h-4 w-4 mr-1" />Generate Key</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
