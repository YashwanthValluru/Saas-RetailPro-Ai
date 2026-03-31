import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { useUISettings } from '@/contexts/UISettingsContext';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Store, Shield, CreditCard, Check, Lock, Copy, QrCode, Palette, Sliders } from 'lucide-react';

const API = '/api';

const PLAN_COLORS = { basic: 'bg-slate-100 text-slate-700', standard: 'bg-blue-100 text-blue-700', premium: 'bg-amber-100 text-amber-800' };

export default function SettingsPage() {
  const { user, checkAuth } = useAuth();
  const { settings, updateSetting, resetSettings, getBorderStyles } = useUISettings();
  const [searchParams] = useSearchParams();
  const [tenant, setTenant] = useState(null);
  const [plans, setPlans] = useState({});
  const [shopForm, setShopForm] = useState({ shop_name: '', business_type: '', address: '', phone: '', gst_number: '' });
  const [mfaStep, setMfaStep] = useState('idle');
  const [qrCode, setQrCode] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [otp, setOtp] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tenantRes, plansRes] = await Promise.all([
          axios.get(`${API}/tenant`, { withCredentials: true }),
          axios.get(`${API}/subscription/plans`, { withCredentials: true })
        ]);
        setTenant(tenantRes.data);
        setPlans(plansRes.data.plans);
        setShopForm({
          shop_name: tenantRes.data.shop_name || '',
          business_type: tenantRes.data.business_type || '',
          address: tenantRes.data.address || '',
          phone: tenantRes.data.phone || '',
          gst_number: tenantRes.data.gst_number || ''
        });
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPayment(sessionId);
    }
  }, [searchParams]);

  const pollPayment = async (sessionId, attempt = 0) => {
    if (attempt >= 5) { toast.error('Payment status check timed out.'); return; }
    try {
      const { data } = await axios.get(`${API}/subscription/checkout/status/${sessionId}`, { withCredentials: true });
      if (data.payment_status === 'paid') {
        toast.success('Subscription upgraded successfully!');
        checkAuth();
        return;
      }
      if (data.status === 'expired') { toast.error('Payment expired.'); return; }
      setTimeout(() => pollPayment(sessionId, attempt + 1), 2000);
    } catch {
      toast.error('Failed to check payment');
    }
  };

  const handleShopUpdate = async () => {
    try {
      await axios.put(`${API}/tenant`, shopForm, { withCredentials: true });
      toast.success('Settings updated');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update');
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      const originUrl = window.location.origin;
      const { data } = await axios.post(`${API}/subscription/checkout`, { plan_id: planId, origin_url: originUrl }, { withCredentials: true });
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Checkout failed');
    }
  };

  const handleMFASetup = async () => {
    try {
      const { data } = await axios.post(`${API}/auth/mfa/setup`, {}, { withCredentials: true });
      setQrCode(data.qr_code);
      setSecretKey(data.secret_key);
      setMfaStep('scan');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'MFA setup failed');
    }
  };

  const handleMFAEnable = async () => {
    try {
      const { data } = await axios.post(`${API}/auth/mfa/enable`, { otp_code: otp }, { withCredentials: true });
      setBackupCodes(data.backup_codes);
      setMfaStep('backup');
      checkAuth();
      toast.success('MFA enabled!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success('Copied!'); };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-500">Loading...</div>;

  return (
    <div data-testid="settings-page" className="space-y-6 max-w-4xl">
      <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>

      <Tabs defaultValue="shop" className="space-y-6">
        <TabsList>
          <TabsTrigger value="shop" data-testid="settings-shop-tab">Shop Details</TabsTrigger>
          <TabsTrigger value="security" data-testid="settings-security-tab">Security & MFA</TabsTrigger>
          <TabsTrigger value="subscription" data-testid="settings-subscription-tab">Subscription</TabsTrigger>
          <TabsTrigger value="ui" data-testid="settings-ui-tab"><Palette className="h-4 w-4 mr-1.5" />UI Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="shop">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2"><Store className="h-5 w-5 text-blue-600" /> Shop Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shop Name</Label>
                  <Input data-testid="shop-name-input" value={shopForm.shop_name} onChange={e => setShopForm(p => ({ ...p, shop_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Business Type</Label>
                  <Input value={shopForm.business_type} onChange={e => setShopForm(p => ({ ...p, business_type: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={shopForm.address} onChange={e => setShopForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={shopForm.phone} onChange={e => setShopForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input value={shopForm.gst_number} onChange={e => setShopForm(p => ({ ...p, gst_number: e.target.value }))} />
                </div>
              </div>
              {user?.role === 'OWNER' && (
                <Button data-testid="save-shop-btn" onClick={handleShopUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2"><Shield className="h-5 w-5 text-blue-600" /> Two-Factor Authentication (MFA)</CardTitle>
              <CardDescription>Secure your account with Microsoft Authenticator or any TOTP app</CardDescription>
            </CardHeader>
            <CardContent>
              {user?.mfa_enabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-md">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">MFA is enabled</p>
                      <p className="text-sm text-green-600">Your account is protected with two-factor authentication.</p>
                    </div>
                  </div>
                  <Button data-testid="regenerate-backup-btn" variant="outline" onClick={async () => {
                    try {
                      const { data } = await axios.post(`${API}/auth/mfa/backup-codes`, {}, { withCredentials: true });
                      setBackupCodes(data.backup_codes);
                      setMfaStep('backup');
                      toast.success('New backup codes generated');
                    } catch (err) {
                      toast.error(err.response?.data?.detail || 'Failed');
                    }
                  }}>
                    Regenerate Backup Codes
                  </Button>
                </div>
              ) : mfaStep === 'idle' ? (
                <div className="space-y-4">
                  <p className="text-slate-600 text-sm">Enable two-factor authentication to add an extra layer of security to your account.</p>
                  <Button data-testid="setup-mfa-btn" onClick={handleMFASetup} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <QrCode className="h-4 w-4 mr-2" /> Set Up MFA
                  </Button>
                </div>
              ) : mfaStep === 'scan' ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">Scan this QR code with Microsoft Authenticator or any TOTP app:</p>
                  <div className="flex justify-center p-6 border-2 border-dashed border-slate-300 rounded-md bg-white">
                    <img data-testid="mfa-qr-code" src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-md">
                    <p className="text-xs text-slate-500 mb-1">Manual setup key:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-slate-900 flex-1 break-all">{secretKey}</code>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(secretKey)}><Copy className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Enter the 6-digit code from your app:</Label>
                    <Input data-testid="mfa-setup-otp" value={otp} onChange={e => setOtp(e.target.value)} placeholder="000000" maxLength={6} className="font-mono text-center text-lg tracking-widest" />
                  </div>
                  <Button data-testid="mfa-enable-btn" onClick={handleMFAEnable} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Verify & Enable MFA</Button>
                </div>
              ) : null}

              {mfaStep === 'backup' && backupCodes.length > 0 && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
                  <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2"><Lock className="h-4 w-4" /> Backup Codes</h4>
                  <p className="text-sm text-amber-700 mb-3">Save these codes securely. Each code can only be used once.</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="font-mono text-sm bg-white p-2 rounded text-center border border-amber-200">{code}</div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(backupCodes.join('\n'))}>
                    <Copy className="h-3.5 w-3.5 mr-2" /> Copy All Codes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <div className="space-y-4">
            <Card className="border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Current Plan</p>
                    <Badge className={`${PLAN_COLORS[tenant?.plan] || PLAN_COLORS.basic} text-sm px-3 py-1`}>
                      {tenant?.plan?.toUpperCase() || 'BASIC'}
                    </Badge>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(plans).map(([id, plan]) => (
                <Card key={id} className={`border ${tenant?.plan === id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Badge className={`${PLAN_COLORS[id]} text-xs mb-2`}>{plan.name}</Badge>
                      <p className="text-3xl font-bold text-slate-900 tabular-nums">₹{plan.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
                    </div>
                    <Separator />
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> Up to {plan.max_users} users</li>
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-green-600" /> {f.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                    {user?.role === 'OWNER' && tenant?.plan !== id && (
                      <Button
                        data-testid={`upgrade-${id}-btn`}
                        onClick={() => handleUpgrade(id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {plans[tenant?.plan]?.price < plan.price ? 'Upgrade' : 'Switch'} to {plan.name}
                      </Button>
                    )}
                    {tenant?.plan === id && (
                      <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* UI Settings Tab */}
        <TabsContent value="ui" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-blue-600" />
                Border Customization
              </CardTitle>
              <CardDescription>
                Customize borders for payment-related pages (POS, Invoices, Purchases)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Border Radius */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Border Radius</Label>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{settings.borders.radius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={settings.borders.radius}
                  onChange={(e) => updateSetting('borders', 'radius', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Sharp (0px)</span>
                  <span>Rounded (20px)</span>
                </div>
              </div>

              <Separator />

              {/* Border Width */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Border Width</Label>
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">{settings.borders.width}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={settings.borders.width}
                  onChange={(e) => updateSetting('borders', 'width', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>None (0px)</span>
                  <span>Thick (4px)</span>
                </div>
              </div>

              <Separator />

              {/* Border Style */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Border Style</Label>
                <div className="grid grid-cols-3 gap-3">
                  {['default', 'subtle', 'bold'].map((style) => (
                    <button
                      key={style}
                      onClick={() => updateSetting('borders', 'style', style)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        settings.borders.style === style
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="text-sm font-medium capitalize mb-2 dark:text-white">{style}</div>
                      <div
                        className={`h-12 rounded ${
                          style === 'default' ? 'border border-slate-200 dark:border-slate-700' :
                          style === 'subtle' ? 'border border-slate-100 dark:border-slate-800' :
                          'border-2 border-slate-300 dark:border-slate-600'
                        } bg-white dark:bg-slate-800`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Preview */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Live Preview</Label>
                <div
                  className={`p-6 bg-white dark:bg-slate-800 ${getBorderStyles().colorClass}`}
                  style={{
                    borderRadius: getBorderStyles().borderRadius,
                    borderWidth: getBorderStyles().borderWidth,
                  }}
                >
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    This is how cards will appear on payment pages with your current settings.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sidebar Settings</CardTitle>
              <CardDescription>Configure sidebar behavior and appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-collapse on Mobile</Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Automatically collapse sidebar on screens smaller than 768px
                  </p>
                </div>
                <Switch
                  checked={settings.sidebar.autoCollapseOnMobile}
                  onCheckedChange={(checked) => updateSetting('sidebar', 'autoCollapseOnMobile', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                resetSettings();
                toast.success('UI settings reset to defaults');
              }}
              className="dark:border-slate-600"
            >
              Reset to Defaults
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
