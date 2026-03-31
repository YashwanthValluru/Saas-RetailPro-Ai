import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Store, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, verifyMFA, backupLogin } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.mfa_required) {
        setTempToken(result.temp_token);
        setStep('mfa');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMFA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (useBackup) {
        await backupLogin(tempToken, backupCode);
      } else {
        await verifyMFA(tempToken, otp);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.pexels.com/photos/2684383/pexels-photo-2684383.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-900/60 flex items-center justify-center">
          <div className="text-center text-white px-12">
            <Store className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h1 className="font-heading text-4xl font-bold mb-4">RetailPro</h1>
            <p className="text-lg text-blue-100 leading-relaxed">
              Production-grade inventory management, billing, and analytics for retail businesses.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[#F8F9FA]">
        <Card className="w-full max-w-md border border-slate-200 shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <Store className="h-6 w-6 text-blue-600" />
              <span className="font-heading font-bold text-xl">RetailPro</span>
            </div>
            <CardTitle className="font-heading text-2xl">
              {step === 'login' ? 'Sign in' : 'Two-Factor Authentication'}
            </CardTitle>
            <CardDescription>
              {step === 'login'
                ? 'Enter your credentials to access your store'
                : 'Enter the verification code from your authenticator app'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div data-testid="login-error" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                {error}
              </div>
            )}

            {step === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    data-testid="login-email-input"
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    data-testid="login-password-input"
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button
                  data-testid="login-submit-btn"
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-center text-sm text-slate-500">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-blue-600 hover:underline font-medium">
                    Create one
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleMFA} className="space-y-4">
                <div className="flex items-center justify-center mb-2">
                  <ShieldCheck className="h-10 w-10 text-blue-600" />
                </div>

                {!useBackup ? (
                  <div className="space-y-2">
                    <Label>Verification Code</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        data-testid="mfa-otp-input"
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="backup">Backup Code</Label>
                    <Input
                      data-testid="mfa-backup-input"
                      id="backup"
                      placeholder="Enter backup code"
                      value={backupCode}
                      onChange={e => setBackupCode(e.target.value)}
                      className="font-mono text-center uppercase"
                    />
                  </div>
                )}

                <Button
                  data-testid="mfa-verify-btn"
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>

                <button
                  type="button"
                  data-testid="mfa-toggle-backup"
                  onClick={() => { setUseBackup(!useBackup); setError(''); }}
                  className="w-full text-center text-sm text-blue-600 hover:underline"
                >
                  {useBackup ? 'Use authenticator app instead' : 'Use backup code instead'}
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
