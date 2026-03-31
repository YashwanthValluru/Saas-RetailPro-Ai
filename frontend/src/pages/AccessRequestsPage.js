import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { KeyRound, CheckCircle, XCircle, Clock, Timer } from 'lucide-react';

const API = '/api';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  expired: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

export default function AccessRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [respondDialog, setRespondDialog] = useState(null);
  const [responseNote, setResponseNote] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const { data } = await axios.get(`${API}/access-requests`, { params, withCredentials: true });
      setRequests(data.requests || []);
    } catch (err) {
      toast.error('Failed to load access requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleRespond = async (action) => {
    try {
      await axios.put(`${API}/access-requests/${respondDialog.id}/respond`, {
        action,
        response_note: responseNote
      }, { withCredentials: true });
      toast.success(`Request ${action}d`);
      setRespondDialog(null);
      setResponseNote('');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to respond');
    }
  };

  const isOwner = user?.role === 'OWNER' && !user?.is_platform_admin;

  return (
    <div data-testid="access-requests-page" className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Access Requests</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {isOwner ? 'Review and manage financial data access requests from platform administrators' : 'Your financial access requests'}
        </p>
      </div>

      <div className="flex gap-2">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm"
            onClick={() => setStatusFilter(s)}
            className={statusFilter === s ? 'bg-blue-600 text-white' : 'dark:border-slate-600 dark:text-slate-300'}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </Button>
        ))}
      </div>

      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                <TableHead className="dark:text-slate-300">Requested By</TableHead>
                <TableHead className="dark:text-slate-300">Type</TableHead>
                <TableHead className="dark:text-slate-300">Reason</TableHead>
                <TableHead className="dark:text-slate-300">Duration</TableHead>
                <TableHead className="dark:text-slate-300">Status</TableHead>
                <TableHead className="dark:text-slate-300">Date</TableHead>
                {isOwner && <TableHead className="text-right dark:text-slate-300">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(r => (
                <TableRow key={r.id} className="even:bg-slate-50 dark:even:bg-slate-700/30">
                  <TableCell className="font-medium dark:text-white">{r.admin_name || r.admin_id?.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm dark:text-slate-300 capitalize">{r.request_type?.replace('_', ' ')}</TableCell>
                  <TableCell className="text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">{r.reason}</TableCell>
                  <TableCell className="text-sm dark:text-slate-300">{r.duration_hours}h</TableCell>
                  <TableCell>
                    <Badge className={`${STATUS_STYLES[r.status] || STATUS_STYLES.pending} text-xs`}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500 dark:text-slate-400">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  {isOwner && (
                    <TableCell className="text-right">
                      {r.status === 'pending' && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setRespondDialog(r)} className="text-green-600 hover:text-green-700" title="Approve">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setRespondDialog(r)} className="text-red-500 hover:text-red-700" title="Reject">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isOwner ? 7 : 6} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <KeyRound className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    {loading ? 'Loading...' : 'No access requests'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Respond Dialog */}
      <Dialog open={!!respondDialog} onOpenChange={() => setRespondDialog(null)}>
        <DialogContent className="max-w-md dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="font-heading dark:text-white">Respond to Access Request</DialogTitle>
          </DialogHeader>
          {respondDialog && (
            <div className="space-y-4 py-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm space-y-1">
                <p className="dark:text-slate-300"><strong>Type:</strong> {respondDialog.request_type?.replace('_', ' ')}</p>
                <p className="dark:text-slate-300"><strong>Reason:</strong> {respondDialog.reason}</p>
                <p className="dark:text-slate-300"><strong>Duration:</strong> {respondDialog.duration_hours} hours</p>
                <p className="dark:text-slate-300"><strong>From:</strong> {respondDialog.admin_name || 'Platform Admin'}</p>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Response Note (optional)</Label>
                <Textarea value={responseNote} onChange={e => setResponseNote(e.target.value)} placeholder="Optional note..." rows={2} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setRespondDialog(null)} className="dark:border-slate-600 dark:text-slate-300">Cancel</Button>
            <Button onClick={() => handleRespond('reject')} variant="destructive">Reject</Button>
            <Button onClick={() => handleRespond('approve')} className="bg-green-600 hover:bg-green-700 text-white">Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
