import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Shield, ShieldOff, UserX, Users as UsersIcon, Wifi, Activity, X, Globe, Settings2, Eye, EyeOff, Package } from 'lucide-react';

const API = '/api';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'STAFF' });
  const [loading, setLoading] = useState(true);
  const [showIPDialog, setShowIPDialog] = useState(null);
  const [ipList, setIpList] = useState([]);
  const [newIP, setNewIP] = useState('');
  const [showActivity, setShowActivity] = useState(null);
  const [activities, setActivities] = useState([]);
  const [usersStatus, setUsersStatus] = useState([]);
  const [showPermissions, setShowPermissions] = useState(null);
  const [permissionsData, setPermissionsData] = useState({ can_view_revenue: false, can_manage_inventory: true });

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API}/users`, { withCredentials: true });
      setUsers(data.users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersStatus = async () => {
    if (currentUser?.role !== 'OWNER') return;
    try {
      const { data } = await axios.get(`${API}/admin/users-status`, { withCredentials: true });
      setUsersStatus(data.users || []);
    } catch {}
  };

  useEffect(() => { fetchUsers(); fetchUsersStatus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    try {
      await axios.post(`${API}/users`, form, { withCredentials: true });
      toast.success('User created');
      setShowDialog(false);
      setForm({ email: '', password: '', name: '', role: 'STAFF' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleResetMFA = async (userId) => {
    if (!window.confirm('Reset MFA for this user? They will need to set up MFA again.')) return;
    try {
      await axios.post(`${API}/admin/users/${userId}/mfa/reset`, {}, { withCredentials: true });
      toast.success('MFA reset successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reset MFA');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await axios.delete(`${API}/users/${userId}`, { withCredentials: true });
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await axios.put(`${API}/users/${userId}`, { is_active: !isActive }, { withCredentials: true });
      toast.success(isActive ? 'User deactivated' : 'User activated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update');
    }
  };

  const openIPDialog = async (userId) => {
    setShowIPDialog(userId);
    try {
      const { data } = await axios.get(`${API}/admin/users/${userId}/ip-whitelist`, { withCredentials: true });
      setIpList(data.allowed_ips || []);
    } catch { setIpList([]); }
  };

  const saveIPs = async () => {
    try {
      await axios.put(`${API}/admin/users/${showIPDialog}/ip-whitelist`, { allowed_ips: ipList }, { withCredentials: true });
      toast.success('IP whitelist updated');
      setShowIPDialog(null);
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const addIP = () => {
    const ip = newIP.trim();
    if (!ip) return;
    if (ipList.includes(ip)) { toast.error('IP already in list'); return; }
    setIpList(prev => [...prev, ip]);
    setNewIP('');
  };

  const removeIP = (ip) => setIpList(prev => prev.filter(i => i !== ip));

  const loadUserActivity = async (userId) => {
    setShowActivity(userId);
    try {
      const { data } = await axios.get(`${API}/admin/user-activity?user_id=${userId}&limit=50`, { withCredentials: true });
      setActivities(data.activities || []);
    } catch { setActivities([]); }
  };

  const openPermissions = async (userId) => {
    try {
      const { data } = await axios.get(`${API}/users/${userId}/permissions`, { withCredentials: true });
      setPermissionsData(data.permissions || { can_view_revenue: false, can_manage_inventory: true });
      setShowPermissions(userId);
    } catch { toast.error('Failed to load permissions'); }
  };

  const savePermissions = async () => {
    try {
      await axios.put(`${API}/users/${showPermissions}/permissions`, permissionsData, { withCredentials: true });
      toast.success('Permissions updated');
      setShowPermissions(null);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to update permissions'); }
  };

  const roleBadge = (role) => {
    const styles = { OWNER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', STAFF: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' };
    return <Badge className={`${styles[role] || styles.STAFF} text-xs font-medium`}>{role}</Badge>;
  };

  const getUserStatus = (userId) => usersStatus.find(u => u.id === userId);

  return (
    <div data-testid="users-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{users.length} users in your organization</p>
        </div>
        <Button data-testid="add-user-btn" onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> Add User
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
                <TableHead className="dark:text-slate-300">MFA</TableHead>
                <TableHead className="dark:text-slate-300">Status</TableHead>
                <TableHead className="dark:text-slate-300">Activity</TableHead>
                <TableHead className="dark:text-slate-300">Permissions</TableHead>
                <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => {
                const status = getUserStatus(u.id);
                return (
                  <TableRow key={u.id || u.email} className="even:bg-slate-50 dark:even:bg-slate-700/30">
                    <TableCell className="font-medium dark:text-white">{u.name}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">{u.email}</TableCell>
                    <TableCell>{roleBadge(u.role)}</TableCell>
                    <TableCell>
                      {u.mfa_enabled ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm"><Shield className="h-3.5 w-3.5" /> Enabled</span>
                      ) : (
                        <span className="text-slate-400 text-sm">Disabled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.is_active !== false ? 'default' : 'destructive'} className="text-xs">
                        {u.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {status && (
                        <div className="text-xs">
                          <span className={`inline-flex items-center gap-1 ${status.is_idle ? 'text-amber-600' : 'text-green-600'}`}>
                            <span className={`w-2 h-2 rounded-full ${status.is_idle ? 'bg-amber-500' : 'bg-green-500'}`} />
                            {status.is_idle ? `Idle ${Math.round(status.idle_minutes)}m` : 'Online'}
                          </span>
                          {status.last_login_device && <p className="text-slate-400 mt-0.5">{status.last_login_device}</p>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.role !== 'OWNER' ? (
                        <div className="flex items-center gap-1.5">
                          <span title={u.permissions?.can_view_revenue ? 'Can view revenue' : 'Revenue hidden'} className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${u.permissions?.can_view_revenue ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                            {u.permissions?.can_view_revenue ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} Rev
                          </span>
                          <span title={u.permissions?.can_manage_inventory !== false ? 'Can manage inventory' : 'Inventory disabled'} className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${u.permissions?.can_manage_inventory !== false ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                            <Package className="h-3 w-3" /> Inv
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Full access</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {currentUser?.role === 'OWNER' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openIPDialog(u.id)} title="IP Whitelist" className="text-slate-500 dark:text-slate-400">
                              <Globe className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => loadUserActivity(u.id)} title="View Activity" className="text-slate-500 dark:text-slate-400">
                              <Activity className="h-4 w-4" />
                            </Button>
                            {u.role !== 'OWNER' && (
                              <Button variant="ghost" size="sm" onClick={() => openPermissions(u.id)} title="Manage Permissions" className="text-purple-500 dark:text-purple-400">
                                <Settings2 className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                        {currentUser?.role === 'OWNER' && u.mfa_enabled && (
                          <Button data-testid={`reset-mfa-${u.id}`} variant="ghost" size="sm" onClick={() => handleResetMFA(u.id)} className="text-amber-600 hover:text-amber-700" title="Reset MFA">
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                        )}
                        {currentUser?.role === 'OWNER' && u.email !== currentUser?.email && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleToggleActive(u.id, u.is_active !== false)} title={u.is_active !== false ? 'Deactivate' : 'Activate'}>
                              <UsersIcon className="h-4 w-4" />
                            </Button>
                            <Button data-testid={`delete-user-${u.id}`} variant="ghost" size="sm" onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700" title="Delete">
                              <UserX className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-slate-500 dark:text-slate-400">{loading ? 'Loading...' : 'No users found'}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="font-heading dark:text-white">Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Name</Label>
              <Input data-testid="user-name-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Email</Label>
              <Input data-testid="user-email-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Password</Label>
              <Input data-testid="user-password-input" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Role</Label>
              <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger data-testid="user-role-select" className="dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  {currentUser?.role === 'OWNER' && <SelectItem value="OWNER">Owner</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} className="dark:border-slate-600 dark:text-slate-300">Cancel</Button>
            <Button data-testid="save-user-btn" onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* IP Whitelist Dialog */}
      {showIPDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">IP Whitelist</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowIPDialog(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Leave empty to allow login from any IP. Add IPs to restrict login to only these addresses.</p>
              <div className="flex gap-2">
                <Input placeholder="e.g., 192.168.1.100" value={newIP} onChange={e => setNewIP(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIP()} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                <Button onClick={addIP} size="sm">Add</Button>
              </div>
              <div className="space-y-1">
                {ipList.map(ip => (
                  <div key={ip} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded text-sm">
                    <span className="font-mono dark:text-white">{ip}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeIP(ip)} className="text-red-500 h-6 w-6 p-0"><X className="h-3 w-3" /></Button>
                  </div>
                ))}
                {ipList.length === 0 && <p className="text-xs text-slate-400 text-center py-2">No IP restrictions (all IPs allowed)</p>}
              </div>
              <Button onClick={saveIPs} className="w-full">Save IP Whitelist</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Log Dialog */}
      {showActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
              <CardTitle className="dark:text-white">User Activity Log</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowActivity(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? <p className="text-slate-500 dark:text-slate-400 text-center py-4">No activity recorded</p> : (
                <div className="space-y-1">
                  {activities.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 border-b dark:border-slate-700 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium dark:text-white">{a.action}</span>
                          {a.user_name && <span className="text-xs text-slate-400">by {a.user_name}</span>}
                        </div>
                        {a.details && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{a.details}</p>}
                        <div className="flex gap-3 text-xs text-slate-400 mt-0.5">
                          <span>{new Date(a.timestamp).toLocaleString()}</span>
                          {a.ip_address && <span>IP: {a.ip_address}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permissions Dialog */}
      {showPermissions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md dark:bg-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="dark:text-white">User Permissions</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPermissions(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-xs text-slate-500 dark:text-slate-400">Control what this user can access. Changes take effect immediately on next page load.</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${permissionsData.can_view_revenue ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-200 dark:bg-slate-600'}`}>
                      {permissionsData.can_view_revenue ? <Eye className="h-4 w-4 text-green-600 dark:text-green-400" /> : <EyeOff className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm dark:text-white">Revenue Visibility</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">View sales, revenue, profit reports</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPermissionsData(p => ({ ...p, can_view_revenue: !p.can_view_revenue }))}
                    className={`w-11 h-6 rounded-full transition-colors ${permissionsData.can_view_revenue ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${permissionsData.can_view_revenue ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${permissionsData.can_manage_inventory ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-200 dark:bg-slate-600'}`}>
                      <Package className={`h-4 w-4 ${permissionsData.can_manage_inventory ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm dark:text-white">Inventory Access</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">View and manage products, stock</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPermissionsData(p => ({ ...p, can_manage_inventory: !p.can_manage_inventory }))}
                    className={`w-11 h-6 rounded-full transition-colors ${permissionsData.can_manage_inventory ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${permissionsData.can_manage_inventory ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Note:</strong> If this user tries to access restricted areas without permission, the owner will automatically receive a security alert and the action will be logged.
                </p>
              </div>

              <Button onClick={savePermissions} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Save Permissions</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
