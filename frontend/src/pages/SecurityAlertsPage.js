import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ShieldAlert, Eye, EyeOff, CheckCheck, AlertTriangle, ShieldX, Wifi, UserX } from 'lucide-react';

const API = '/api';

const SEVERITY_STYLES = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

const TYPE_ICONS = {
  failed_logins: UserX,
  new_ip_login: Wifi,
  ip_blocked: ShieldX,
  unauthorized_access: AlertTriangle,
  suspicious_activity: ShieldAlert,
};

const TYPE_LABELS = {
  failed_logins: 'Failed Logins',
  new_ip_login: 'New IP Login',
  ip_blocked: 'IP Blocked',
  unauthorized_access: 'Unauthorized Access',
  suspicious_activity: 'Suspicious Activity',
};

export default function SecurityAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterRead, setFilterRead] = useState('false');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 25 };
      if (filterRead) params.is_read = filterRead;
      if (filterSeverity) params.severity = filterSeverity;
      const { data } = await axios.get(`${API}/security/alerts`, { params, withCredentials: true });
      setAlerts(data.alerts);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [page, filterRead, filterSeverity]);

  const fetchSummary = async () => {
    try {
      const { data } = await axios.get(`${API}/security/alerts/summary`, { withCredentials: true });
      setSummary(data);
    } catch {}
  };

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);
  useEffect(() => { fetchSummary(); }, []);

  const markRead = async (alertId) => {
    try {
      await axios.put(`${API}/security/alerts/${alertId}/read`, {}, { withCredentials: true });
      fetchAlerts();
      fetchSummary();
    } catch { toast.error('Failed to mark as read'); }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/security/alerts/read-all`, {}, { withCredentials: true });
      toast.success('All alerts marked as read');
      fetchAlerts();
      fetchSummary();
    } catch { toast.error('Failed'); }
  };

  return (
    <div data-testid="security-alerts-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Security Alerts</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor suspicious activities and threats</p>
        </div>
        {summary?.unread > 0 && (
          <Button onClick={markAllRead} variant="outline" size="sm" className="dark:border-slate-600 dark:text-slate-300">
            <CheckCheck className="h-4 w-4 mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-red-500 dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.high_severity_unread}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">High Severity</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.medium_severity_unread}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Medium Severity</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.unread}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Unread Alerts</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-slate-400 dark:bg-slate-800 dark:border-slate-700">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-600 dark:text-slate-300">{summary.total}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Alerts</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Type Breakdown */}
      {summary?.by_type && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(summary.by_type).map(([type, count]) => {
            const Icon = TYPE_ICONS[type] || ShieldAlert;
            return count > 0 ? (
              <div key={type} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-sm">
                <Icon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">{TYPE_LABELS[type] || type}: <span className="font-semibold">{count}</span></span>
              </div>
            ) : null;
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={filterRead === 'false' ? 'default' : 'outline'} size="sm"
          onClick={() => { setFilterRead('false'); setPage(1); }}
          className={filterRead === 'false' ? 'bg-blue-600 text-white' : 'dark:border-slate-600 dark:text-slate-300'}>Unread</Button>
        <Button variant={filterRead === '' ? 'default' : 'outline'} size="sm"
          onClick={() => { setFilterRead(''); setPage(1); }}
          className={filterRead === '' ? 'bg-blue-600 text-white' : 'dark:border-slate-600 dark:text-slate-300'}>All</Button>
        <span className="border-l border-slate-300 dark:border-slate-600 mx-1" />
        {['', 'high', 'medium', 'low'].map(s => (
          <Button key={s} variant={filterSeverity === s ? 'default' : 'outline'} size="sm"
            onClick={() => { setFilterSeverity(s); setPage(1); }}
            className={filterSeverity === s ? 'bg-blue-600 text-white' : 'dark:border-slate-600 dark:text-slate-300'}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Severity'}
          </Button>
        ))}
      </div>

      {/* Alerts Table */}
      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                <TableHead className="w-8 dark:text-slate-300"></TableHead>
                <TableHead className="dark:text-slate-300">Type</TableHead>
                <TableHead className="dark:text-slate-300">Severity</TableHead>
                <TableHead className="dark:text-slate-300">User</TableHead>
                <TableHead className="dark:text-slate-300">Details</TableHead>
                <TableHead className="dark:text-slate-300">Time</TableHead>
                <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map(a => {
                const Icon = TYPE_ICONS[a.alert_type] || ShieldAlert;
                return (
                  <TableRow key={a.id} className={`${!a.is_read ? 'bg-amber-50/30 dark:bg-amber-900/5' : 'even:bg-slate-50 dark:even:bg-slate-700/30'}`}>
                    <TableCell>
                      {!a.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-medium dark:text-white">{TYPE_LABELS[a.alert_type] || a.alert_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.medium} text-xs`}>{a.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="dark:text-white">{a.user_name || 'Unknown'}</span>
                        {a.user_email && <p className="text-xs text-slate-400">{a.user_email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {a.details?.message || JSON.stringify(a.details || {}).slice(0, 80)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {!a.is_read && (
                        <Button variant="ghost" size="sm" onClick={() => markRead(a.id)} title="Mark as read" className="text-slate-500 dark:text-slate-400">
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {alerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    {loading ? 'Loading...' : 'No security alerts'}
                  </TableCell>
                </TableRow>
              )}
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
    </div>
  );
}
