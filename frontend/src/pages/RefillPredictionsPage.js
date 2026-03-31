import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  RefreshCw, Users, AlertTriangle, Send, Clock, CheckCircle, Pill,
  ArrowUpRight, ArrowDownRight, Phone, MessageCircle, Calendar
} from 'lucide-react';

const API = '/api';

export default function RefillPredictionsPage() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [summary, setSummary] = useState({ overdue: 0, due_soon: 0 });
  const [loading, setLoading] = useState(true);
  const [sendDialog, setSendDialog] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/customers/refill-predictions`, { withCredentials: true });
      setPredictions(data.predictions || []);
      setSummary(data.summary || { overdue: 0, due_soon: 0 });
    } catch (err) {
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPredictions(); }, [fetchPredictions]);

  const sendReminder = async (prediction) => {
    setSending(true);
    try {
      const { data } = await axios.post(`${API}/customers/send-refill-reminder`, {
        customer_id: prediction.customer_id,
        product_name: prediction.product_name,
        message: customMessage || prediction.suggested_message,
      }, { withCredentials: true });
      
      if (data.whatsapp_link) {
        window.open(data.whatsapp_link, '_blank');
      }
      toast.success('Reminder generated! Opening WhatsApp...');
      setSendDialog(null);
      setCustomMessage('');
    } catch (err) {
      toast.error('Failed to send reminder');
    } finally {
      setSending(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
        <span className="text-slate-500 font-heading">Analyzing purchase patterns...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Pill className="h-6 w-6 text-blue-600" /> Predictive Refill Reminders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">AI detects recurring purchase patterns and reminds customers before they run out</p>
        </div>
        <Button variant="outline" onClick={fetchPredictions} className="dark:border-slate-600 dark:text-slate-300">
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.overdue}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Overdue Refills</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-full">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.due_soon}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Due Soon (7 days)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-full">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{predictions.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Predictions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predictions Table */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading dark:text-white">Customer Refill Predictions</CardTitle>
          <CardDescription className="dark:text-slate-400">Based on purchase frequency analysis over 6 months</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                <TableHead className="dark:text-slate-300">Customer</TableHead>
                <TableHead className="dark:text-slate-300">Product</TableHead>
                <TableHead className="dark:text-slate-300 text-center">Frequency</TableHead>
                <TableHead className="dark:text-slate-300 text-center">Purchases</TableHead>
                <TableHead className="dark:text-slate-300">Last Purchase</TableHead>
                <TableHead className="dark:text-slate-300 text-center">Status</TableHead>
                <TableHead className="dark:text-slate-300 text-center">Urgency</TableHead>
                <TableHead className="dark:text-slate-300 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictions.map((p, i) => (
                <TableRow key={i} className="dark:border-slate-700">
                  <TableCell className="font-medium dark:text-white">{p.customer_name}</TableCell>
                  <TableCell className="dark:text-slate-300">{p.product_name}</TableCell>
                  <TableCell className="text-center dark:text-slate-300">
                    Every {p.avg_interval_days} days
                  </TableCell>
                  <TableCell className="text-center dark:text-slate-300">{p.purchase_count}×</TableCell>
                  <TableCell className="text-sm dark:text-slate-400">
                    {new Date(p.last_purchase).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {p.is_overdue ? (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs">
                        {p.days_overdue}d overdue
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                        Due in {p.days_until}d
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`text-xs ${getUrgencyColor(p.urgency)}`}>
                      {p.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => { setSendDialog(p); setCustomMessage(p.suggested_message); }}>
                      <Send className="h-3 w-3 mr-1" /> Remind
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {predictions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <Pill className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No refill predictions yet</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Predictions appear when customers have recurring purchase patterns (2+ purchases of the same item)</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Send Reminder Dialog */}
      <Dialog open={!!sendDialog} onOpenChange={() => setSendDialog(null)}>
        <DialogContent className="max-w-md dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" /> Send Refill Reminder
            </DialogTitle>
          </DialogHeader>
          {sendDialog && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-sm font-medium dark:text-white">{sendDialog.customer_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Product: {sendDialog.product_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {sendDialog.is_overdue ? `${sendDialog.days_overdue} days overdue` : `Due in ${sendDialog.days_until} days`}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium dark:text-slate-300">Message</label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-xs text-green-700 dark:text-green-300">
                  <strong>WhatsApp:</strong> This will open WhatsApp with the pre-filled message. Customer's phone number from their profile will be used.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialog(null)} className="dark:border-slate-600 dark:text-slate-300">Cancel</Button>
            <Button onClick={() => sendReminder(sendDialog)} disabled={sending} className="bg-green-600 hover:bg-green-700 text-white">
              {sending ? 'Sending...' : 'Send via WhatsApp'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
