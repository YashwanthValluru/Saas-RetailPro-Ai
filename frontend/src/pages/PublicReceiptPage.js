import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, CheckCircle, Star } from 'lucide-react';

const API = '/api';

export default function PublicReceiptPage() {
  const { shareToken } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const { data } = await axios.get(`${API}/receipt/${shareToken}`);
        setReceipt(data);
      } catch (err) {
        setError('Receipt not found or link expired');
      } finally {
        setLoading(false);
      }
    };
    if (shareToken) fetchReceipt();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-700">Receipt Not Found</h2>
            <p className="text-sm text-slate-500 mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl border-0">
        <CardContent className="p-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold">{receipt.shop_name}</h1>
              <CheckCircle className="h-6 w-6 text-green-300" />
            </div>
            <p className="text-blue-100 text-sm">Digital Receipt</p>
            <div className="flex items-center justify-between mt-3 text-sm text-blue-100">
              <span>#{receipt.invoice_number}</span>
              <span>{new Date(receipt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Customer */}
          <div className="px-6 py-3 bg-slate-50 border-b">
            <p className="text-sm text-slate-500">Customer</p>
            <p className="font-medium text-slate-800">{receipt.customer_name}</p>
          </div>

          {/* Items */}
          <div className="px-6 py-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Items</h3>
            <div className="space-y-2">
              {receipt.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.quantity} × ₹{item.price?.toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">₹{(item.quantity * item.price).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="px-6 py-3 bg-slate-50 space-y-1.5">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>₹{receipt.subtotal?.toLocaleString()}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-₹{receipt.discount?.toLocaleString()}</span>
              </div>
            )}
            {receipt.tax > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Tax (GST)</span>
                <span>₹{receipt.tax?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>₹{receipt.grand_total?.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment & Loyalty */}
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize text-xs">{receipt.payment_method}</Badge>
            </div>
            {receipt.loyalty_points > 0 && (
              <div className="flex items-center gap-1 text-amber-600">
                <Star className="h-4 w-4 fill-amber-400" />
                <span className="text-sm font-semibold">+{receipt.loyalty_points} points earned</span>
              </div>
            )}
          </div>

          {/* Branding Footer */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-4 rounded-b-lg text-center">
            <p className="text-xs text-slate-300 mb-1">{receipt.branding?.footer}</p>
            <p className="text-lg font-bold tracking-tight">{receipt.branding?.logo_text}</p>
            <p className="text-xs text-slate-400">{receipt.branding?.tagline}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
