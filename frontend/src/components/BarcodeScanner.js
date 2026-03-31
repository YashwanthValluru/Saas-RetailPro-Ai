import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Smartphone, ScanLine, RefreshCw, X, Loader2, Wifi } from 'lucide-react';

const API = '/api';

export function ScanFromPhoneButton({ type, onBarcodeScan }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef(null);

  const createSession = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/scan/session`, { type }, { withCredentials: true });
      setSession(data);
      setPolling(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create scan session');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingSession = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/scan/session/${type}`, { withCredentials: true });
      if (data.session) {
        setSession(data.session);
        setPolling(true);
      }
    } catch {}
  }, [type]);

  useEffect(() => {
    if (open && !session) {
      checkExistingSession();
    }
  }, [open, session, checkExistingSession]);

  // Poll for scanned barcodes
  useEffect(() => {
    if (!polling || !session?.id) return;

    const poll = async () => {
      try {
        const { data } = await axios.get(`${API}/scan/poll/${session.id}`, { withCredentials: true });
        if (data.scans?.length > 0) {
          for (const scan of data.scans) {
            onBarcodeScan(scan.barcode, scan.product);
            if (scan.product) {
              toast.success(`Scanned: ${scan.product.name}`);
            } else {
              toast.info(`Barcode scanned: ${scan.barcode} (product not found)`);
            }
          }
        }
      } catch {}
    };

    pollRef.current = setInterval(poll, 1500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [polling, session, onBarcodeScan]);

  const handleClose = () => {
    setOpen(false);
    // Keep polling in background even when dialog closed
  };

  const revokeSession = async () => {
    if (session) {
      try {
        await axios.delete(`${API}/scan/session/${session.id}`, { withCredentials: true });
      } catch {}
    }
    setSession(null);
    setPolling(false);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const scanUrl = session ? `${window.location.origin}/scan/${session.id}` : '';
  const isExpired = session && new Date(session.expires_at) < new Date();

  return (
    <>
      <Button
        data-testid={`scan-phone-${type}-btn`}
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Smartphone className="h-4 w-4" />
        {polling && !isExpired && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
        Scan from Phone
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              {type === 'pos' ? 'POS' : 'Inventory'} — Phone Scanner
            </DialogTitle>
          </DialogHeader>

          {!session || isExpired ? (
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm text-slate-600">
                Generate a QR code to scan barcodes from your phone. Session expires at 10:00 PM.
              </p>
              <Button
                data-testid="generate-scan-session-btn"
                onClick={createSession}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ScanLine className="h-4 w-4 mr-2" />}
                {isExpired ? 'Generate New Session' : 'Generate QR Code'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex justify-center p-4 bg-white border-2 border-dashed border-slate-200 rounded-md">
                <QRCodeSVG value={scanUrl} size={200} level="M" />
              </div>

              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <Wifi className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Listening for scans...</span>
                </div>
                <p className="text-xs text-slate-400">
                  Scan this QR with your phone camera to open the scanner
                </p>
                <Badge variant="outline" className="text-xs font-mono">
                  Expires: {new Date(session.expires_at).toLocaleTimeString()}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={revokeSession}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> New Session
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleClose}>
                  <X className="h-3.5 w-3.5 mr-1" /> Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BarcodeInput({ onBarcodeScan, placeholder = "Scan or enter barcode..." }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = () => {
    if (value.trim()) {
      onBarcodeScan(value.trim());
      setValue('');
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          ref={inputRef}
          data-testid="barcode-input"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder={placeholder}
          className="pl-10 font-mono"
        />
      </div>
      <Button onClick={handleSubmit} disabled={!value.trim()} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
        <ScanLine className="h-4 w-4" />
      </Button>
    </div>
  );
}
