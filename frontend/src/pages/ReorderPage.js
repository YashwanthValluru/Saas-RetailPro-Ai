import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, RefreshCw, Bell, Mail, MessageSquare, Phone, Trash2, Edit, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';

const API = '/api';
const VARIABLES = '{{shop_name}}, {{owner_name}}, {{product_name}}, {{current_stock}}, {{threshold}}, {{reorder_quantity}}, {{sku}}, {{branch_name}}';

export default function ReorderPage() {
  const [rules, setRules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [products, setProducts] = useState([]);
  const [showRuleDialog, setShowRuleDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [ruleForm, setRuleForm] = useState({ product_id: '', threshold: '', reorder_quantity: '', notify_whatsapp: false, notify_email: false, notify_voice: false, supplier_phone: '', supplier_email: '' });
  const [templateForm, setTemplateForm] = useState({ channel: 'whatsapp', name: '', subject: '', template_text: '' });
  const [editRuleId, setEditRuleId] = useState(null);
  const [editTemplateId, setEditTemplateId] = useState(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    try { const { data } = await axios.get(`${API}/reorder/rules`, { withCredentials: true }); setRules(data.rules || []); }
    catch (err) { if (err.response?.status === 403) toast.error('Premium feature'); }
    finally { setLoading(false); }
  }, []);

  const fetchTemplates = async () => {
    try { const { data } = await axios.get(`${API}/notification-templates`, { withCredentials: true }); setTemplates(data.templates || []); } catch {}
  };

  const fetchLogs = async () => {
    try { const { data } = await axios.get(`${API}/notification-logs`, { withCredentials: true }); setLogs(data.logs || []); setLogsTotal(data.total || 0); } catch {}
  };

  const fetchProducts = async () => {
    try { const { data } = await axios.get(`${API}/inventory/products?limit=500`, { withCredentials: true }); setProducts(data.products || []); } catch {}
  };

  useEffect(() => { fetchRules(); fetchTemplates(); fetchLogs(); fetchProducts(); }, [fetchRules]);

  const saveRule = async () => {
    if (!ruleForm.product_id || !ruleForm.threshold || !ruleForm.reorder_quantity) { toast.error('Product, threshold, and quantity are required'); return; }
    try {
      const payload = { ...ruleForm, threshold: parseInt(ruleForm.threshold), reorder_quantity: parseInt(ruleForm.reorder_quantity) };
      if (editRuleId) {
        await axios.put(`${API}/reorder/rules/${editRuleId}`, payload, { withCredentials: true });
      } else {
        await axios.post(`${API}/reorder/rules`, payload, { withCredentials: true });
      }
      toast.success(editRuleId ? 'Rule updated' : 'Rule created');
      setShowRuleDialog(false); setEditRuleId(null); fetchRules();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const deleteRule = async (id) => {
    try { await axios.delete(`${API}/reorder/rules/${id}`, { withCredentials: true }); toast.success('Rule deleted'); fetchRules(); } catch { toast.error('Failed'); }
  };

  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.template_text) { toast.error('Name and template text required'); return; }
    try {
      if (editTemplateId) {
        await axios.put(`${API}/notification-templates/${editTemplateId}`, templateForm, { withCredentials: true });
      } else {
        await axios.post(`${API}/notification-templates`, templateForm, { withCredentials: true });
      }
      toast.success('Template saved'); setShowTemplateDialog(false); setEditTemplateId(null); fetchTemplates();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const runCheck = async () => {
    setChecking(true);
    try { const { data } = await axios.post(`${API}/reorder/check`, {}, { withCredentials: true }); toast.success(data.message); fetchLogs(); }
    catch { toast.error('Check failed'); }
    finally { setChecking(false); }
  };

  const channelIcon = { whatsapp: MessageSquare, email: Mail, voice: Phone };
  const statusColor = { sent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', failed: 'bg-red-100 text-red-700', ready: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', queued_mock: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };

  return (
    <div data-testid="reorder-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Auto Reorder</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1"><Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs mr-2">Premium</Badge>Smart stock alerts & notifications</p>
        </div>
        <Button onClick={runCheck} disabled={checking} className="bg-amber-600 hover:bg-amber-700 text-white">
          <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} /> Check Stock Now
        </Button>
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="dark:bg-slate-700">
          <TabsTrigger value="rules" className="dark:data-[state=active]:bg-slate-600">Reorder Rules ({rules.length})</TabsTrigger>
          <TabsTrigger value="templates" className="dark:data-[state=active]:bg-slate-600">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="logs" className="dark:data-[state=active]:bg-slate-600">Notification Log ({logsTotal})</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => { setEditRuleId(null); setRuleForm({ product_id: '', threshold: '', reorder_quantity: '', notify_whatsapp: false, notify_email: false, notify_voice: false, supplier_phone: '', supplier_email: '' }); setShowRuleDialog(true); }} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-1" />Add Rule</Button>
          </div>
          <Card className="border dark:border-slate-700 bg-white dark:bg-slate-800"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="bg-slate-50 dark:bg-slate-700/50">
                <TableHead className="dark:text-slate-300">Product</TableHead><TableHead className="dark:text-slate-300">Stock</TableHead><TableHead className="dark:text-slate-300">Threshold</TableHead><TableHead className="dark:text-slate-300">Reorder Qty</TableHead><TableHead className="dark:text-slate-300">Channels</TableHead><TableHead className="dark:text-slate-300">Status</TableHead><TableHead className="text-right dark:text-slate-300">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {rules.map(r => {
                  const belowThreshold = (r.current_stock || 0) <= r.threshold;
                  return (
                    <TableRow key={r.id} className={belowThreshold ? 'bg-red-50/50 dark:bg-red-900/10' : 'even:bg-slate-50 dark:even:bg-slate-700/30'}>
                      <TableCell className="font-medium dark:text-white">{r.product_name}<br/><span className="text-xs text-slate-400">{r.sku}</span></TableCell>
                      <TableCell className={belowThreshold ? 'text-red-600 font-bold' : 'dark:text-slate-300'}>{r.current_stock ?? '?'}</TableCell>
                      <TableCell className="dark:text-slate-300">{r.threshold}</TableCell>
                      <TableCell className="dark:text-slate-300">{r.reorder_quantity}</TableCell>
                      <TableCell><div className="flex gap-1">
                        {r.notify_whatsapp && <MessageSquare className="h-4 w-4 text-green-500" />}
                        {r.notify_email && <Mail className="h-4 w-4 text-blue-500" />}
                        {r.notify_voice && <Phone className="h-4 w-4 text-amber-500" />}
                      </div></TableCell>
                      <TableCell>{belowThreshold ? <Badge className="bg-red-100 text-red-700 text-xs flex items-center gap-1 w-fit"><AlertTriangle className="h-3 w-3" />Low</Badge> : <Badge className="bg-green-100 text-green-700 text-xs flex items-center gap-1 w-fit"><CheckCircle className="h-3 w-3" />OK</Badge>}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => deleteRule(r.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  );
                })}
                {rules.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-500"><Bell className="h-8 w-8 mx-auto mb-2 text-slate-300" />{loading ? 'Loading...' : 'No reorder rules yet'}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="flex justify-end mb-3">
            <Button size="sm" onClick={() => { setEditTemplateId(null); setTemplateForm({ channel: 'whatsapp', name: '', subject: '', template_text: '' }); setShowTemplateDialog(true); }} className="bg-blue-600 hover:bg-blue-700 text-white"><Plus className="h-4 w-4 mr-1" />Add Template</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(t => { const Icon = channelIcon[t.channel] || Bell; return (
              <Card key={t.id} className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 dark:text-white"><Icon className="h-4 w-4" />{t.name}<Badge className="text-xs ml-auto capitalize">{t.channel}</Badge></CardTitle></CardHeader>
                <CardContent><p className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap line-clamp-4">{t.template_text}</p>
                  <Button variant="ghost" size="sm" className="mt-2 text-blue-500" onClick={() => { setTemplateForm(t); setEditTemplateId(t.id); setShowTemplateDialog(true); }}><Edit className="h-3 w-3 mr-1" />Edit</Button>
                </CardContent>
              </Card>
            ); })}
            {templates.length === 0 && <p className="text-slate-500 dark:text-slate-400 col-span-3 text-center py-8">No templates yet. Create templates to customize reorder notifications.</p>}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="border dark:border-slate-700 bg-white dark:bg-slate-800"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="bg-slate-50 dark:bg-slate-700/50">
                <TableHead className="dark:text-slate-300">Channel</TableHead><TableHead className="dark:text-slate-300">Product</TableHead><TableHead className="dark:text-slate-300">Recipient</TableHead><TableHead className="dark:text-slate-300">Status</TableHead><TableHead className="dark:text-slate-300">Time</TableHead><TableHead className="text-right dark:text-slate-300">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {logs.map(l => { const Icon = channelIcon[l.channel] || Bell; return (
                  <TableRow key={l.id} className="even:bg-slate-50 dark:even:bg-slate-700/30">
                    <TableCell><div className="flex items-center gap-2"><Icon className="h-4 w-4" /><span className="text-sm capitalize dark:text-white">{l.channel}</span></div></TableCell>
                    <TableCell className="text-sm dark:text-slate-300">{l.product_name || '-'}</TableCell>
                    <TableCell className="text-sm dark:text-slate-400">{l.recipient}</TableCell>
                    <TableCell><Badge className={`${statusColor[l.status] || 'bg-slate-100 text-slate-700'} text-xs`}>{l.status === 'queued_mock' ? 'Queued (Mock)' : l.status}</Badge></TableCell>
                    <TableCell className="text-sm text-slate-400">{new Date(l.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{l.whatsapp_url && <a href={l.whatsapp_url} target="_blank" rel="noopener noreferrer"><Button variant="ghost" size="sm" className="text-green-600"><ExternalLink className="h-4 w-4 mr-1" />Send</Button></a>}</TableCell>
                  </TableRow>
                ); })}
                {logs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">No notifications sent yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Rule Dialog */}
      <Dialog open={showRuleDialog} onOpenChange={setShowRuleDialog}>
        <DialogContent className="max-w-lg dark:bg-slate-800">
          <DialogHeader><DialogTitle className="dark:text-white">{editRuleId ? 'Edit' : 'Create'} Reorder Rule</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Product *</Label>
              <Select value={ruleForm.product_id} onValueChange={v => setRuleForm(p => ({...p, product_id: v}))}>
                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent className="max-h-60">{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="dark:text-slate-300">Threshold *</Label><Input type="number" value={ruleForm.threshold} onChange={e => setRuleForm(p => ({...p, threshold: e.target.value}))} placeholder="10" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Reorder Qty *</Label><Input type="number" value={ruleForm.reorder_quantity} onChange={e => setRuleForm(p => ({...p, reorder_quantity: e.target.value}))} placeholder="50" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Notification Channels</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm dark:text-slate-300"><input type="checkbox" checked={ruleForm.notify_whatsapp} onChange={e => setRuleForm(p => ({...p, notify_whatsapp: e.target.checked}))} className="rounded" /><MessageSquare className="h-4 w-4 text-green-500" />WhatsApp</label>
                <label className="flex items-center gap-2 text-sm dark:text-slate-300"><input type="checkbox" checked={ruleForm.notify_email} onChange={e => setRuleForm(p => ({...p, notify_email: e.target.checked}))} className="rounded" /><Mail className="h-4 w-4 text-blue-500" />Email</label>
                <label className="flex items-center gap-2 text-sm dark:text-slate-300"><input type="checkbox" checked={ruleForm.notify_voice} onChange={e => setRuleForm(p => ({...p, notify_voice: e.target.checked}))} className="rounded" /><Phone className="h-4 w-4 text-amber-500" />Voice (Mock)</label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="dark:text-slate-300">Supplier Phone</Label><Input value={ruleForm.supplier_phone} onChange={e => setRuleForm(p => ({...p, supplier_phone: e.target.value}))} placeholder="+919876543210" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Supplier Email</Label><Input value={ruleForm.supplier_email} onChange={e => setRuleForm(p => ({...p, supplier_email: e.target.value}))} placeholder="supplier@email.com" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRuleDialog(false)} className="dark:border-slate-600 dark:text-slate-300">Cancel</Button>
            <Button onClick={saveRule} className="bg-blue-600 hover:bg-blue-700 text-white">Save Rule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg dark:bg-slate-800">
          <DialogHeader><DialogTitle className="dark:text-white">{editTemplateId ? 'Edit' : 'Create'} Template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="dark:text-slate-300">Channel</Label>
                <Select value={templateForm.channel} onValueChange={v => setTemplateForm(p => ({...p, channel: v}))}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="voice">Voice</SelectItem></SelectContent>
                </Select></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Name</Label><Input value={templateForm.name} onChange={e => setTemplateForm(p => ({...p, name: e.target.value}))} placeholder="Reorder Alert" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
            </div>
            {templateForm.channel === 'email' && <div className="space-y-2"><Label className="dark:text-slate-300">Subject</Label><Input value={templateForm.subject} onChange={e => setTemplateForm(p => ({...p, subject: e.target.value}))} placeholder="Reorder Alert: {{product_name}}" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>}
            <div className="space-y-2"><Label className="dark:text-slate-300">Template Text</Label><Textarea value={templateForm.template_text} onChange={e => setTemplateForm(p => ({...p, template_text: e.target.value}))} rows={6} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono text-sm" /></div>
            <p className="text-xs text-slate-400">Available variables: {VARIABLES}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)} className="dark:border-slate-600 dark:text-slate-300">Cancel</Button>
            <Button onClick={saveTemplate} className="bg-blue-600 hover:bg-blue-700 text-white">Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
