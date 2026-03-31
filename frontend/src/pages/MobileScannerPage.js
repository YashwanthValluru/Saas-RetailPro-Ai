import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScanLine, CheckCircle, XCircle, Camera, Keyboard, Store } from 'lucide-react';

const API = '/api';

export default function MobileScannerPage() {
  const { sessionId } = useParams();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [error, setError] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await axios.get(`${API}/scan/mobile/${sessionId}`);
        setSessionInfo(data);
      } catch {
        setError('This scan session has expired or is invalid. Please generate a new one from your laptop.');
      }
    };
    fetchSession();
  }, [sessionId]);

  const submitBarcode = async (barcode) => {
    if (!barcode.trim()) return;
    setScanning(true);
    try {
      const { data } = await axios.post(`${API}/scan/mobile/${sessionId}/barcode`, { barcode: barcode.trim() });
      setLastResult({ barcode: barcode.trim(), found: data.product_found, name: data.product_name, product_info: data.product_info });
      setManualBarcode('');
    } catch (err) {
      setLastResult({ barcode, found: false, error: err.response?.data?.detail || 'Failed to submit' });
    } finally {
      setScanning(false);
    }
  };

  const startCamera = async () => {
    setCameraMode(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode("mobile-scanner-view");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 280, height: 150 } },
        (decodedText) => {
          submitBarcode(decodedText);
          // Brief pause after successful scan
          scanner.pause(true);
          setTimeout(() => {
            try { scanner.resume(); } catch {}
          }, 2000);
        },
        () => {}
      );
    } catch (err) {
      setError('Camera access denied or not available. Use manual entry instead.');
      setCameraMode(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setCameraMode(false);
  };

  useEffect(() => {
    return () => { if (scannerRef.current) { try { scannerRef.current.stop(); } catch {} } };
  }, []);

  if (error && !sessionInfo) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border border-red-200">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">Session Expired</p>
            <p className="text-sm text-slate-500 mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionInfo) {
    return <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center"><p className="text-slate-500">Loading...</p></div>;
  }

  const typeLabel = sessionInfo.type === 'pos' ? 'POS / Billing' : 'Inventory';
  const typeColor = sessionInfo.type === 'pos' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4" data-testid="mobile-scanner-page">
      <div className="max-w-sm mx-auto space-y-4">
        {/* Header */}
        <Card className="border border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Store className="h-6 w-6 text-blue-600" />
              <div className="flex-1">
                <p className="font-bold text-slate-900">{sessionInfo.shop_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${typeColor} text-xs`}>{typeLabel} Scanner</Badge>
                  <span className="text-xs text-slate-400">Expires {new Date(sessionInfo.expires_at).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Camera Scanner */}
        {cameraMode ? (
          <Card className="border border-slate-200 overflow-hidden">
            <div id="mobile-scanner-view" className="w-full" style={{ minHeight: 300 }} />
            <CardContent className="p-3">
              <Button variant="outline" onClick={stopCamera} className="w-full">
                <XCircle className="h-4 w-4 mr-2" /> Stop Camera
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-slate-200">
            <CardContent className="p-4 space-y-3">
              <Button
                data-testid="start-camera-btn"
                onClick={startCamera}
                className="w-full h-24 bg-blue-600 hover:bg-blue-700 text-white flex-col gap-2"
              >
                <Camera className="h-8 w-8" />
                <span>Open Camera to Scan</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manual Entry */}
        <Card className="border border-slate-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-medium text-slate-700">Manual Barcode Entry</p>
            </div>
            <div className="flex gap-2">
              <Input
                data-testid="manual-barcode-input"
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitBarcode(manualBarcode)}
                placeholder="Enter barcode number..."
                className="font-mono"
                autoComplete="off"
              />
              <Button
                data-testid="submit-barcode-btn"
                onClick={() => submitBarcode(manualBarcode)}
                disabled={!manualBarcode.trim() || scanning}
                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
              >
                <ScanLine className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Last Scan Result */}
        {lastResult && (
          <Card className={`border ${lastResult.found ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {lastResult.found ? (
                  <CheckCircle className="h-6 w-6 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-amber-600 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium truncate">{lastResult.barcode}</p>
                  {lastResult.found ? (
                    <p className="text-sm text-green-700 mt-0.5">Sent: {lastResult.name}</p>
                  ) : (
                    <p className="text-sm text-amber-700 mt-0.5">{lastResult.error || 'New product — barcode sent to laptop for lookup'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-center text-slate-400">
          Scanned barcodes are instantly sent to your laptop
        </p>
      </div>
    </div>
  );
}
