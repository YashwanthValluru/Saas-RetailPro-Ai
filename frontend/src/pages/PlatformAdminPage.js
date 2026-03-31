import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Users, Package, TicketCheck, KeyRound, Eye, Shield, Send, Plus, Ban, CheckCircle, Clock, ArrowUpCircle } from 'lucide-react';

const API = '/api';

export default function PlatformAdminPage() {
  const { user } = useAuth();
  const isPlatformAdmin = user?.is_platform_admin;
  const isAdmin = user?.is_admin;
  const isProductSide = isPlatformAdmin || isAdmin;
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [tenantsTotal, setTenantsTotal] = useState(0);
  const [tenantsPage, setTenantsPage] = useState(1);
  const [tenantsPages, setTenantsPages] = useState(1);
  const [accessRequests, setAccessRequests] = useState([]);
  const [showRequestAccess, setShowRequestAccess] = useState(null);
  const [requestForm, setRequestForm] = useState({ request_type: 'revenue', reason: '', duration_hours: 24 });
  const [financialData, setFinancialData] = useState(null);
  const [showFinancials, setShowFinancials] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateOwner, setShowCreateOwner] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ email: '', password: '', name: '', shop_name: '', business_type: 'general', plan: 'basic', valid_days: 365 });
  // Admin management (platform admin only)
  const [admins, setAdmins] = useState([]);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', password: '', name: '' });

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API}/platform/stats`, { withCredentials: true });
      setStats(data);
    } catch {}
  };

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/platform/tenants`, { params: { page: tenantsPage, limit: 15 }, withCredentials: true });
      setTenants(data.tenants);
      setTenantsTotal(data.total);
      setTenantsPages(data.pages);
    } catch (err) {
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }, [tenantsPage]);

  const fetchAccessRequests = async () => {
    try {
      const { data } = await axios.get(`${API}/access-requests`, { withCredentials: true });
      setAccessRequests(data.requests || []);
    } catch {}
  };

  useEffect(() => { fetchStats(); fetchAccessRequests(); if (isPlatformAdmin) fetchAdmins(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const fetchAdmins = async () => {
    try {
      const { data } = await axios.get(`${API}/platform/admins`, { withCredentials: true });
      setAdmins(data.admins || []);
    } catch {}
  };

  const createAdminAccount = async () => {
    if (!adminForm.email || !adminForm.password || !adminForm.name) {
      toast.error('All fields are required'); return;
    }
    try {
      await axios.post(`${API}/platform/create-admin`, adminForm, { withCredentials: true });
      toast.success('Admin account created');
      setShowCreateAdmin(false);
      setAdminForm({ email: '', password: '', name: '' });
      fetchAdmins();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const toggleAdminStatus = async (adminId, currentActive) => {
    try {
      await axios.put(`${API}/platform/admins/${adminId}/status`, { is_active: !currentActive }, { withCredentials: true });
      toast.success(currentActive ? 'Admin deactivated' : 'Admin activated');
      fetchAdmins();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const deleteAdmin = async (adminId, email) => {
    if (!window.confirm(`Delete admin account ${email}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/platform/admins/${adminId}`, { withCredentials: true });
      toast.success('Admin account deleted');
      fetchAdmins();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const createOwner = async () => {
    if (!ownerForm.email || !ownerForm.password || !ownerForm.name || !ownerForm.shop_name) {
      toast.error('Email, password, name, and shop name are required'); return;
    }
    try {
      await axios.post(`${API}/platform/create-owner`, ownerForm, { withCredentials: true });
      toast.success('Owner account created');
      setShowCreateOwner(false);
      setOwnerForm({ email: '', password: '', name: '', shop_name: '', business_type: 'general', plan: 'basic', valid_days: 365 });
      fetchTenants(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const updateTenantStatus = async (tenantId, action) => {
    try {
      await axios.put(`${API}/platform/tenants/${tenantId}/status`, { action }, { withCredentials: true });
      toast.success(`Tenant ${action}d`); fetchTenants(); fetchStats();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const extendValidity = async (tenantId) => {
    const days = prompt('Extend by how many days?', '30');
    if (!days) return;
    try {
      await axios.put(`${API}/platform/tenants/${tenantId}/extend`, { days: parseInt(days) }, { withCredentials: true });
      toast.success(`Extended by ${days} days`); fetchTenants();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const changePlan = async (tenantId, plan) => {
    try {
      await axios.put(`${API}/platform/tenants/${tenantId}/plan`, { plan }, { withCredentials: true });
      toast.success(`Plan updated to ${plan}`); fetchTenants();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const requestAccess = async () => {
    if (!requestForm.reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      await axios.post(`${API}/platform/access-requests`, {
        owner_id: showRequestAccess.owner_id,
        tenant_id: showRequestAccess.tenant_id,
        request_type: requestForm.request_type,
        reason: requestForm.reason,
        duration_hours: requestForm.duration_hours
      }, { withCredentials: true });
      toast.success('Access request submitted');
      setShowRequestAccess(null);
      setRequestForm({ request_type: 'revenue', reason: '', duration_hours: 24 });
      fetchAccessRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to request access');
    }
  };

  const viewFinancials = async (tenantId) => {
    try {
      const { data } = await axios.get(`${API}/platform/tenant-financials/${tenantId}`, { withCredentials: true });
      setFinancialData(data);
      setShowFinancials(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Access denied - you need an approved access request');
    }
  };

  if (!isProductSide) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md dark:bg-slate-800">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold dark:text-white">Access Denied</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">This page is restricted to platform administrators and admins.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="platform-admin-page" className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Platform Administration</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage tenants and platform operations</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4 text-center">
              <Building2 className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <div className="text-2xl font-bold dark:text-white">{stats.total_tenants}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Tenants</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4 text-center">
              <Building2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <div className="text-2xl font-bold dark:text-white">{stats.active_tenants}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Active</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-purple-500 mx-auto mb-1" />
              <div className="text-2xl font-bold dark:text-white">{stats.total_users}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Users</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4 text-center">
              <Package className="h-6 w-6 text-orange-500 mx-auto mb-1" />
              <div className="text-2xl font-bold dark:text-white">{stats.total_products}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Products</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4 text-center">
              <TicketCheck className="h-6 w-6 text-amber-500 mx-auto mb-1" />
              <div className="text-2xl font-bold dark:text-white">{stats.open_support_tickets}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Open Tickets</div>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4 text-center">
              <KeyRound className="h-6 w-6 text-red-500 mx-auto mb-1" />
              <div className="text-2xl font-bold dark:text-white">{stats.pending_access_requests}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Pending Access</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="tenants">
        <TabsList className="dark:bg-slate-700">
          <TabsTrigger value="tenants" className="dark:data-[state=active]:bg-slate-600">Tenants</TabsTrigger>
          <TabsTrigger value="access" className="dark:data-[state=active]:bg-slate-600">Access Requests</TabsTrigger>
          {isPlatformAdmin && (
            <TabsTrigger value="admins" className="dark:data-[state=active]:bg-slate-600">Manage Admins</TabsTrigger>
          )}
        </TabsList>

        {/* Tenants Tab */}
        <TabsContent value="tenants">
          <div className="flex justify-end mb-3">
            <Button onClick={() => setShowCreateOwner(true)} className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Create Owner Account
            </Button>
          </div>
          <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                    <TableHead className="dark:text-slate-300">Shop Name</TableHead>
                    <TableHead className="dark:text-slate-300">Business</TableHead>
                    <TableHead className="dark:text-slate-300">Plan</TableHead>
                    <TableHead className="dark:text-slate-300">Users</TableHead>
                    <TableHead className="dark:text-slate-300">Valid Until</TableHead>
                    <TableHead className="dark:text-slate-300">Status</TableHead>
                    <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.filter(t => t.id !== 'system').map(t => (
                    <TableRow key={t.id} className="even:bg-slate-50 dark:even:bg-slate-700/30">
                      <TableCell className="font-medium dark:text-white">{t.shop_name}</TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400 capitalize">{t.business_type}</TableCell>
                      <TableCell>
                        <Select value={t.plan} onValueChange={(v) => changePlan(t.id, v)}>
                          <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm dark:text-slate-300">{t.user_count}</TableCell>
                      <TableCell className="text-sm dark:text-slate-400">
                        {t.valid_until ? (
                          <span className={new Date(t.valid_until) < new Date() ? 'text-red-500' : ''}>
                            {new Date(t.valid_until).toLocaleDateString()}
                          </span>
                        ) : 'No expiry'}
                      </TableCell>
                      <TableCell>
                        {t.is_revoked ? (
                          <Badge className="bg-red-100 text-red-700 text-xs">Revoked</Badge>
                        ) : t.is_active ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 text-xs">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => viewFinancials(t.id)} title="View Financials" className="text-slate-500"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => setShowRequestAccess({ tenant_id: t.id, shop_name: t.shop_name, owner_id: '' })} title="Request Access" className="text-blue-500"><KeyRound className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => extendValidity(t.id)} title="Extend Validity" className="text-green-500"><Clock className="h-4 w-4" /></Button>
                          {t.is_active && !t.is_revoked ? (
                            <Button variant="ghost" size="sm" onClick={() => updateTenantStatus(t.id, 'revoke')} title="Revoke" className="text-red-500"><Ban className="h-4 w-4" /></Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => updateTenantStatus(t.id, 'activate')} title="Activate" className="text-green-500"><CheckCircle className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tenants.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400">
                        {loading ? 'Loading...' : 'No tenants found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {tenantsPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={tenantsPage <= 1} onClick={() => setTenantsPage(p => p - 1)}>Previous</Button>
              <span className="flex items-center text-sm text-slate-500">Page {tenantsPage} of {tenantsPages}</span>
              <Button variant="outline" size="sm" disabled={tenantsPage >= tenantsPages} onClick={() => setTenantsPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </TabsContent>

        {/* Access Requests Tab */}
        <TabsContent value="access">
          <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                    <TableHead className="dark:text-slate-300">Tenant</TableHead>
                    <TableHead className="dark:text-slate-300">Type</TableHead>
                    <TableHead className="dark:text-slate-300">Reason</TableHead>
                    <TableHead className="dark:text-slate-300">Status</TableHead>
                    <TableHead className="dark:text-slate-300">Expires</TableHead>
                    <TableHead className="dark:text-slate-300">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessRequests.map(r => (
                    <TableRow key={r.id} className="even:bg-slate-50 dark:even:bg-slate-700/30">
                      <TableCell className="font-medium dark:text-white">{r.tenant_id?.slice(0, 8)}...</TableCell>
                      <TableCell className="text-sm dark:text-slate-300 capitalize">{r.request_type?.replace('_', ' ')}</TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">{r.reason}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${
                          r.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : r.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {r.expires_at ? new Date(r.expires_at).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {accessRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                        No access requests yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Admins Tab (Platform Admin only) */}
        {isPlatformAdmin && (
          <TabsContent value="admins">
            <div className="flex justify-end mb-3">
              <Button onClick={() => setShowCreateAdmin(true)} className="bg-purple-600 hover:bg-purple-700 text-white" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Create Admin Account
              </Button>
            </div>
            <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                      <TableHead className="dark:text-slate-300">Name</TableHead>
                      <TableHead className="dark:text-slate-300">Email</TableHead>
                      <TableHead className="dark:text-slate-300">Role</TableHead>
                      <TableHead className="dark:text-slate-300">Status</TableHead>
                      <TableHead className="dark:text-slate-300">Created</TableHead>
                      <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map(a => (
                      <TableRow key={a.id} className="even:bg-slate-50 dark:even:bg-slate-700/30">
                        <TableCell className="font-medium dark:text-white">{a.name}</TableCell>
                        <TableCell className="text-sm dark:text-slate-300">{a.email}</TableCell>
                        <TableCell><Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs">ADMIN</Badge></TableCell>
                        <TableCell>
                          {a.is_active ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 text-xs">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500 dark:text-slate-400">
                          {a.created_at ? new Date(a.created_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => toggleAdminStatus(a.id, a.is_active)} title={a.is_active ? 'Deactivate' : 'Activate'} className={a.is_active ? 'text-red-500' : 'text-green-500'}>
                              {a.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteAdmin(a.id, a.email)} title="Delete" className="text-red-500 hover:text-red-700">
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {admins.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                          No admin accounts created yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Request Access Dialog */}
      <Dialog open={!!showRequestAccess} onOpenChange={() => setShowRequestAccess(null)}>
        <DialogContent className="max-w-md dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="font-heading dark:text-white">Request Financial Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Requesting access to: <span className="font-medium text-slate-700 dark:text-slate-300">{showRequestAccess?.shop_name}</span></p>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Access Type</Label>
              <Select value={requestForm.request_type} onValueChange={v => setRequestForm(p => ({ ...p, request_type: v }))}>
                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue Data</SelectItem>
                  <SelectItem value="transactions">Transaction History</SelectItem>
                  <SelectItem value="full_financial">Full Financial Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Reason *</Label>
              <Textarea value={requestForm.reason} onChange={e => setRequestForm(p => ({ ...p, reason: e.target.value }))} placeholder="Why do you need access?" rows={3} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Duration (hours)</Label>
              <Input type="number" value={requestForm.duration_hours} onChange={e => setRequestForm(p => ({ ...p, duration_hours: parseInt(e.target.value) || 24 }))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestAccess(null)} className="dark:border-slate-600 dark:text-slate-300">Cancel</Button>
            <Button onClick={requestAccess} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Send className="h-4 w-4 mr-2" /> Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Financial Data View */}
      {showFinancials && financialData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto dark:bg-slate-800">
            <CardHeader className="sticky top-0 bg-white dark:bg-slate-800 z-10 border-b dark:border-slate-700">
              <div className="flex items-center justify-between">
                <CardTitle className="dark:text-white">Tenant Financial Data</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setShowFinancials(false); setFinancialData(null); }}>Close</Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Access expires: {new Date(financialData.access_expires_at).toLocaleString()}</p>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Shop</div>
                  <div className="text-lg font-semibold dark:text-white">{financialData.tenant?.shop_name}</div>
                </div>
                {financialData.total_revenue != null && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-sm text-green-600 dark:text-green-400">Total Revenue</div>
                    <div className="text-lg font-semibold text-green-700 dark:text-green-300">${financialData.total_revenue?.toLocaleString()}</div>
                  </div>
                )}
                {financialData.total_invoices != null && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-sm text-blue-600 dark:text-blue-400">Total Invoices</div>
                    <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{financialData.total_invoices}</div>
                  </div>
                )}
              </div>

              {financialData.recent_transactions && (
                <div>
                  <h3 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Recent Transactions</h3>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {financialData.recent_transactions.slice(0, 20).map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-sm">
                        <span className="dark:text-slate-300">Invoice #{t.invoice_number || t.id?.slice(0, 8)}</span>
                        <span className="font-mono font-semibold dark:text-white">${t.grand_total?.toFixed(2)}</span>
                        <span className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Owner Dialog */}
      <Dialog open={showCreateOwner} onOpenChange={setShowCreateOwner}>
        <DialogContent className="max-w-lg dark:bg-slate-800">
          <DialogHeader><DialogTitle className="dark:text-white">Create Owner Account</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="dark:text-slate-300">Name *</Label><Input value={ownerForm.name} onChange={e => setOwnerForm(p => ({...p, name: e.target.value}))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Email *</Label><Input type="email" value={ownerForm.email} onChange={e => setOwnerForm(p => ({...p, email: e.target.value}))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="dark:text-slate-300">Password *</Label><Input type="password" value={ownerForm.password} onChange={e => setOwnerForm(p => ({...p, password: e.target.value}))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Shop Name *</Label><Input value={ownerForm.shop_name} onChange={e => setOwnerForm(p => ({...p, shop_name: e.target.value}))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label className="dark:text-slate-300">Business Type</Label>
                <Select value={ownerForm.business_type} onValueChange={v => setOwnerForm(p => ({...p, business_type: v}))}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="general">General</SelectItem><SelectItem value="medical">Medical</SelectItem><SelectItem value="hardware">Hardware</SelectItem><SelectItem value="wholesale">Wholesale</SelectItem></SelectContent>
                </Select></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Plan</Label>
                <Select value={ownerForm.plan} onValueChange={v => setOwnerForm(p => ({...p, plan: v}))}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="basic">Basic</SelectItem><SelectItem value="standard">Standard</SelectItem><SelectItem value="premium">Premium</SelectItem></SelectContent>
                </Select></div>
              <div className="space-y-2"><Label className="dark:text-slate-300">Validity (days)</Label><Input type="number" value={ownerForm.valid_days} onChange={e => setOwnerForm(p => ({...p, valid_days: parseInt(e.target.value) || 365}))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" /></div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300"><strong>Data Retention:</strong> Even if revoked/expired, all data is preserved. On reactivation, the owner regains full access.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateOwner(false)} className="dark:border-slate-600 dark:text-slate-300">Cancel</Button>
            <Button onClick={createOwner} className="bg-blue-600 hover:bg-blue-700 text-white">Create Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Create Admin Dialog (Platform Admin only) */}
      {isPlatformAdmin && (
        <Dialog open={showCreateAdmin} onOpenChange={setShowCreateAdmin}>
          <DialogContent className="max-w-md dark:bg-slate-800">
            <DialogHeader><DialogTitle className="dark:text-white">Create Admin Account</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Full Name *</Label>
                <Input value={adminForm.name} onChange={e => setAdminForm(p => ({...p, name: e.target.value}))} placeholder="Admin User" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Email *</Label>
                <Input type="email" value={adminForm.email} onChange={e => setAdminForm(p => ({...p, email: e.target.value}))} placeholder="admin@retailpro.com" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Password *</Label>
                <Input type="password" value={adminForm.password} onChange={e => setAdminForm(p => ({...p, password: e.target.value}))} placeholder="Strong password" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <p className="text-xs text-purple-700 dark:text-purple-300"><strong>Admin Role:</strong> This user will have access to tenant management, analytics, support tickets, and can create owner accounts. Admins are managed exclusively by Platform Admin.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateAdmin(false)} className="dark:border-slate-600 dark:text-slate-300">Cancel</Button>
              <Button onClick={createAdminAccount} className="bg-purple-600 hover:bg-purple-700 text-white">Create Admin</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
