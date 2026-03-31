import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollText } from 'lucide-react';

const API = '/api';

const ACTION_COLORS = {
  login: 'bg-green-100 text-green-800',
  logout: 'bg-slate-100 text-slate-700',
  register: 'bg-blue-100 text-blue-800',
  mfa_enabled: 'bg-green-100 text-green-800',
  mfa_verified: 'bg-green-100 text-green-800',
  mfa_setup_initiated: 'bg-blue-100 text-blue-800',
  admin_mfa_reset: 'bg-amber-100 text-amber-800',
  product_created: 'bg-blue-100 text-blue-800',
  product_updated: 'bg-blue-100 text-blue-800',
  product_deleted: 'bg-red-100 text-red-800',
  invoice_created: 'bg-green-100 text-green-800',
  user_created: 'bg-blue-100 text-blue-800',
  user_deleted: 'bg-red-100 text-red-800',
  checkout_created: 'bg-amber-100 text-amber-800',
  subscription_upgraded: 'bg-green-100 text-green-800',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const { data } = await axios.get(`${API}/audit-logs`, { params: { page, limit: 30 }, withCredentials: true });
      setLogs(data.logs);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page]);

  return (
    <div data-testid="audit-logs-page" className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 mt-1">{total} actions recorded</p>
      </div>

      <Card className="border border-slate-200 bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, i) => (
                <TableRow key={i} className="even:bg-slate-50">
                  <TableCell className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-700'} text-xs`}>
                      {log.action?.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 max-w-xs truncate">{log.details || '-'}</TableCell>
                  <TableCell className="text-sm text-slate-400 font-mono">{log.ip_address || '-'}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                    <ScrollText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    {loading ? 'Loading...' : 'No audit logs recorded yet'}
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
