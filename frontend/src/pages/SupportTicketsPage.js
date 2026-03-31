import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { TicketCheck, Plus, MessageSquare, Phone, Mail, Send, ChevronRight, ExternalLink } from 'lucide-react';

const API = '/api';

const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  closed: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  normal: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

export default function SupportTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [contactInfo, setContactInfo] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [form, setForm] = useState({ subject: '', description: '', channel: 'email', priority: 'normal' });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await axios.get(`${API}/support/tickets`, { params, withCredentials: true });
      setTickets(data.tickets);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  const fetchContactInfo = async () => {
    try {
      const { data } = await axios.get(`${API}/support/contact-info`, { withCredentials: true });
      setContactInfo(data);
    } catch {}
  };

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { fetchContactInfo(); }, []);

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      toast.error('Subject and description are required');
      return;
    }
    try {
      await axios.post(`${API}/support/tickets`, form, { withCredentials: true });
      toast.success('Support ticket created');
      setShowCreate(false);
      setForm({ subject: '', description: '', channel: 'email', priority: 'normal' });
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create ticket');
    }
  };

  const openDetail = async (ticketId) => {
    try {
      const { data } = await axios.get(`${API}/support/tickets/${ticketId}`, { withCredentials: true });
      setShowDetail(data);
    } catch { toast.error('Failed to load ticket details'); }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    try {
      await axios.post(`${API}/support/tickets/${showDetail.id}/notes`, { message: noteText }, { withCredentials: true });
      toast.success('Note added');
      setNoteText('');
      const { data } = await axios.get(`${API}/support/tickets/${showDetail.id}`, { withCredentials: true });
      setShowDetail(data);
    } catch (err) { toast.error('Failed to add note'); }
  };

  const updateStatus = async (ticketId, status) => {
    try {
      await axios.put(`${API}/support/tickets/${ticketId}/status`, { status }, { withCredentials: true });
      toast.success(`Ticket ${status.replace('_', ' ')}`);
      fetchTickets();
      if (showDetail?.id === ticketId) {
        const { data } = await axios.get(`${API}/support/tickets/${ticketId}`, { withCredentials: true });
        setShowDetail(data);
      }
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to update status'); }
  };

  const isPlatformAdmin = user?.is_platform_admin;

  return (
    <div data-testid="support-tickets-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Support</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{total} ticket{total !== 1 ? 's' : ''}</p>
        </div>
        <Button data-testid="create-ticket-btn" onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" /> New Ticket
        </Button>
      </div>

      {/* Contact Info Banner */}
      {contactInfo && (
        <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Contact Support:</span>
              <a href={`mailto:${contactInfo.email}`} className="inline-flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-300 hover:underline">
                <Mail className="h-4 w-4" /> {contactInfo.email}
              </a>
              <a href={`tel:${contactInfo.phone}`} className="inline-flex items-center gap-1.5 text-sm text-blue-700 dark:text-blue-300 hover:underline">
                <Phone className="h-4 w-4" /> {contactInfo.phone}
              </a>
              <a href={contactInfo.whatsapp_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400 hover:underline">
                <MessageSquare className="h-4 w-4" /> WhatsApp Chat <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-xs text-slate-500 dark:text-slate-400">{contactInfo.hours}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {['', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm"
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={statusFilter === s ? 'bg-blue-600 text-white' : 'dark:border-slate-600 dark:text-slate-300'}>
            {s ? s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'All'}
          </Button>
        ))}
      </div>

      {/* Tickets Table */}
      <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                <TableHead className="dark:text-slate-300">Subject</TableHead>
                <TableHead className="dark:text-slate-300">Status</TableHead>
                <TableHead className="dark:text-slate-300">Priority</TableHead>
                <TableHead className="dark:text-slate-300">Channel</TableHead>
                <TableHead className="dark:text-slate-300">Created</TableHead>
                <TableHead className="dark:text-slate-300">Updated</TableHead>
                <TableHead className="text-right dark:text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(t => (
                <TableRow key={t.id} className="even:bg-slate-50 dark:even:bg-slate-700/30 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50" onClick={() => openDetail(t.id)}>
                  <TableCell className="font-medium dark:text-white max-w-xs truncate">{t.subject}</TableCell>
                  <TableCell><Badge className={`${STATUS_STYLES[t.status] || STATUS_STYLES.open} text-xs`}>{t.status?.replace('_', ' ')}</Badge></TableCell>
                  <TableCell><Badge className={`${PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.normal} text-xs`}>{t.priority}</Badge></TableCell>
                  <TableCell className="text-sm text-slate-500 dark:text-slate-400 capitalize">{t.channel}</TableCell>
                  <TableCell className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{new Date(t.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDetail(t.id); }}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {tickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <TicketCheck className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    {loading ? 'Loading...' : 'No support tickets yet'}
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

      {/* Create Ticket Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="font-heading dark:text-white">Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Subject *</Label>
              <Input data-testid="ticket-subject" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Brief summary of your issue" className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-slate-300">Description *</Label>
              <Textarea data-testid="ticket-description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your issue in detail..." rows={4} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Preferred Channel</Label>
                <Select value={form.channel} onValueChange={v => setForm(p => ({ ...p, channel: v }))}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="dark:text-slate-300">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="dark:border-slate-600 dark:text-slate-300">Cancel</Button>
            <Button data-testid="submit-ticket-btn" onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">Submit Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[85vh] overflow-auto dark:bg-slate-800">
            <CardHeader className="sticky top-0 bg-white dark:bg-slate-800 z-10 border-b dark:border-slate-700">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="dark:text-white text-lg">{showDetail.subject}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${STATUS_STYLES[showDetail.status]} text-xs`}>{showDetail.status?.replace('_', ' ')}</Badge>
                    <Badge className={`${PRIORITY_STYLES[showDetail.priority]} text-xs`}>{showDetail.priority}</Badge>
                    <span className="text-xs text-slate-400 capitalize">{showDetail.channel}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowDetail(null)}>Close</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              {/* Description */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{showDetail.description}</p>
                <p className="text-xs text-slate-400 mt-2">{showDetail.owner_name} &middot; {new Date(showDetail.created_at).toLocaleString()}</p>
              </div>

              {/* Status Actions */}
              <div className="flex gap-2">
                {showDetail.status !== 'closed' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(showDetail.id, 'closed')} className="dark:border-slate-600 dark:text-slate-300">Close Ticket</Button>
                )}
                {showDetail.status === 'closed' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(showDetail.id, 'open')} className="dark:border-slate-600 dark:text-slate-300">Reopen</Button>
                )}
                {isPlatformAdmin && showDetail.status === 'open' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(showDetail.id, 'in_progress')} className="text-amber-600 border-amber-300">Mark In Progress</Button>
                )}
                {isPlatformAdmin && showDetail.status === 'in_progress' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(showDetail.id, 'resolved')} className="text-green-600 border-green-300">Mark Resolved</Button>
                )}
              </div>

              {/* Notes Thread */}
              <div className="space-y-3">
                <h3 className="font-medium text-slate-700 dark:text-slate-300 text-sm">Notes ({showDetail.notes?.length || 0})</h3>
                {(showDetail.notes || []).map(n => (
                  <div key={n.id} className={`rounded-lg p-3 text-sm ${
                    n.author_type === 'admin'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'bg-slate-50 dark:bg-slate-700/50'
                  }`}>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {n.author_name} ({n.author_type}) &middot; {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Note */}
              {showDetail.status !== 'closed' && (
                <div className="flex gap-2">
                  <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." rows={2} className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                  <Button onClick={addNote} size="sm" className="self-end bg-blue-600 hover:bg-blue-700 text-white">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
