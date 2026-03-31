import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', name: '', shop_name: '', business_type: 'general' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1768796373360-95d80c5830fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjB3YXJlaG91c2UlMjBpbnZlbnRvcnl8ZW58MHx8fHwxNzc0NzcwMTc1fDA&ixlib=rb-4.1.0&q=85"
          alt="Warehouse"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
          <div className="text-center text-white px-12">
            <h1 className="font-heading text-4xl font-bold mb-4">Get Started</h1>
            <p className="text-lg text-slate-200">Set up your store in under 2 minutes. Full inventory, billing, and analytics.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[#F8F9FA]">
        <Card className="w-full max-w-md border border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2 lg:hidden mb-4">
              <Store className="h-6 w-6 text-blue-600" />
              <span className="font-heading font-bold text-xl">RetailPro</span>
            </div>
            <CardTitle className="font-heading text-2xl">Create your account</CardTitle>
            <CardDescription>Start your free trial with the Basic plan</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div data-testid="register-error" className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input data-testid="register-name-input" id="name" value={form.name} onChange={e => update('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop">Shop / Business Name</Label>
                <Input data-testid="register-shop-input" id="shop" value={form.shop_name} onChange={e => update('shop_name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="btype">Business Type</Label>
                <Select value={form.business_type} onValueChange={v => update('business_type', v)}>
                  <SelectTrigger data-testid="register-business-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Store</SelectItem>
                    <SelectItem value="medical">Medical / Pharmacy</SelectItem>
                    <SelectItem value="hardware">Hardware Store</SelectItem>
                    <SelectItem value="wholesale">Wholesale</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remail">Email</Label>
                <Input data-testid="register-email-input" id="remail" type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rpassword">Password</Label>
                <Input data-testid="register-password-input" id="rpassword" type="password" value={form.password} onChange={e => update('password', e.target.value)} required />
              </div>
              <Button data-testid="register-submit-btn" type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
