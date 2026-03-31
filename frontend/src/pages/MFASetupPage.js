import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { ShieldCheck, QrCode, Copy, Lock, ArrowRight, Smartphone } from 'lucide-react';

const API = '/api';

export default function MFASetupPage() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('intro');
  const [qrCode, setQrCode] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [otp, setOtp] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${API}/auth/mfa/setup`, {}, { withCredentials: true });
      setQrCode(data.qr_code);
      setSecretKey(data.secret_key);
      setStep('scan');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Enter a 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`${API}/auth/mfa/enable`, { otp_code: otp }, { withCredentials: true });
      setBackupCodes(data.backup_codes);
      setStep('backup');
      await checkAuth();
      toast.success('MFA enabled successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border border-slate-200 shadow-sm" data-testid="mfa-setup-page">
        {step === 'intro' && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="font-heading text-2xl">Set Up Two-Factor Authentication</CardTitle>
              <CardDescription className="text-base mt-2">
                Your account requires MFA to be set up before you can access the system. This protects your account with an extra layer of security.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-md">
                  <Smartphone className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-slate-900">Step 1: Install Authenticator App</p>
                    <p className="text-xs text-slate-500 mt-0.5">Download Microsoft Authenticator or Google Authenticator on your phone</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-md">
                  <QrCode className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-slate-900">Step 2: Scan QR Code</p>
                    <p className="text-xs text-slate-500 mt-0.5">Scan the QR code displayed here with your authenticator app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-md">
                  <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-slate-900">Step 3: Verify & Save Backup Codes</p>
                    <p className="text-xs text-slate-500 mt-0.5">Enter the 6-digit code to verify, then save your backup codes securely</p>
                  </div>
                </div>
              </div>

              <Button
                data-testid="mfa-start-setup-btn"
                onClick={handleSetup}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base"
              >
                {loading ? 'Setting up...' : 'Begin MFA Setup'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <p className="text-xs text-center text-slate-400">
                Logged in as <span className="font-medium">{user?.email}</span>
              </p>
            </CardContent>
          </>
        )}

        {step === 'scan' && (
          <>
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-heading text-2xl">Scan QR Code</CardTitle>
              <CardDescription>Open your authenticator app and scan this code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div data-testid="mfa-setup-error" className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}

              <div className="flex justify-center p-6 border-2 border-dashed border-slate-300 rounded-md bg-white">
                <img data-testid="mfa-qr-image" src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>

              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-xs text-slate-500 mb-1">Can't scan? Enter this key manually:</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-slate-900 flex-1 break-all">{secretKey}</code>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(secretKey)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Enter the 6-digit code from your app</Label>
                <Input
                  data-testid="mfa-otp-input"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="font-mono text-center text-2xl tracking-[0.5em] h-14"
                  autoFocus
                />
              </div>

              <Button
                data-testid="mfa-verify-setup-btn"
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
              >
                {loading ? 'Verifying...' : 'Verify & Enable MFA'}
              </Button>
            </CardContent>
          </>
        )}

        {step === 'backup' && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="font-heading text-2xl text-green-800">MFA Enabled Successfully!</CardTitle>
              <CardDescription>Save these backup codes in a safe place. Each code can only be used once.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="h-4 w-4 text-amber-700" />
                  <p className="font-semibold text-amber-800 text-sm">Backup Recovery Codes</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {backupCodes.map((code, i) => (
                    <div key={i} className="font-mono text-sm bg-white p-2 rounded text-center border border-amber-200 font-medium">
                      {code}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                  className="w-full"
                >
                  <Copy className="h-3.5 w-3.5 mr-2" /> Copy All Codes
                </Button>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-700">
                  <strong>Important:</strong> If you lose your phone and don't have these codes, only your account owner can reset your MFA. Save them now!
                </p>
              </div>

              <Button
                data-testid="mfa-complete-btn"
                onClick={handleComplete}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base"
              >
                I've Saved My Codes — Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </>
        )}
      </Card>
      <Toaster position="top-right" />
    </div>
  );
}
