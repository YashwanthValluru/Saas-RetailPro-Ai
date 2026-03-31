import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Package, Loader2, Sparkles, ArrowRight } from 'lucide-react';

const API = '/api';

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
};

const ConfidenceBadge = ({ level }) => {
  const styles = { high: 'bg-green-100 text-green-800', medium: 'bg-amber-100 text-amber-800', low: 'bg-red-100 text-red-800' };
  return <Badge className={`${styles[level] || styles.medium} text-xs`}>{level}</Badge>;
};

const PriorityBadge = ({ priority }) => {
  const styles = { urgent: 'bg-red-100 text-red-800', normal: 'bg-blue-100 text-blue-800', low: 'bg-slate-100 text-slate-700' };
  return <Badge className={`${styles[priority] || styles.normal} text-xs`}>{priority}</Badge>;
};

export default function ForecastPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateForecast = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: result } = await axios.get(`${API}/reports/ai-forecast`, { withCredentials: true });
      setData(result);
      toast.success('AI forecast generated');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to generate forecast';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const ai = data?.ai_analysis;

  return (
    <div data-testid="forecast-page" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">AI Demand Forecasting</h1>
          <p className="text-slate-500 mt-1">Powered by GPT-5.2 - Analyze trends and predict demand</p>
        </div>
        <Button
          data-testid="generate-forecast-btn"
          onClick={generateForecast}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
          {loading ? 'Analyzing...' : 'Generate Forecast'}
        </Button>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {!data && !loading && (
        <Card className="border border-slate-200 bg-white">
          <CardContent className="py-16 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-blue-400" />
            <h3 className="font-heading text-xl font-semibold text-slate-900 mb-2">AI-Powered Insights</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Analyze your last 30 days of sales data to get demand predictions, restock recommendations, and business insights.
            </p>
            <Button onClick={generateForecast} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Brain className="h-4 w-4 mr-2" /> Generate Your First Forecast
            </Button>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="border border-blue-200 bg-blue-50">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-3 text-blue-600 animate-spin" />
            <p className="text-blue-700 font-medium">Analyzing sales data with AI...</p>
            <p className="text-blue-500 text-sm mt-1">This may take a few seconds</p>
          </CardContent>
        </Card>
      )}

      {data && !loading && (
        <>
          {/* AI Summary */}
          {ai?.forecast_summary && (
            <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Brain className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-widest font-medium text-blue-600 mb-1">AI Analysis</p>
                    <p className="text-slate-800 leading-relaxed">{ai.forecast_summary}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Revenue Forecast */}
          {ai?.revenue_forecast && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Next Week Estimate</p>
                  <p className="text-2xl font-bold tabular-nums text-slate-900">₹{ai.revenue_forecast.next_week_estimate?.toLocaleString() || '—'}</p>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Next Month Estimate</p>
                  <p className="text-2xl font-bold tabular-nums text-slate-900">₹{ai.revenue_forecast.next_month_estimate?.toLocaleString() || '—'}</p>
                </CardContent>
              </Card>
              <Card className="border border-slate-200 bg-white">
                <CardContent className="p-6">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Growth Trend</p>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendIcon trend={ai.revenue_forecast.growth_trend === 'growing' ? 'up' : ai.revenue_forecast.growth_trend === 'declining' ? 'down' : 'stable'} />
                    <span className="text-lg font-semibold text-slate-900 capitalize">{ai.revenue_forecast.growth_trend || '—'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Revenue Trend Chart */}
          {data.revenue_trend?.length > 0 && (
            <Card className="border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" /> Revenue Trend (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.revenue_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={v => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '6px' }} formatter={(v) => [`₹${v.toFixed(2)}`, 'Revenue']} />
                      <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Demand Predictions */}
            {ai?.demand_predictions?.length > 0 && (
              <Card className="border border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Demand Predictions</CardTitle>
                  <CardDescription>Forecasted weekly demand per product</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Weekly Demand</TableHead>
                        <TableHead>Trend</TableHead>
                        <TableHead>Confidence</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ai.demand_predictions.map((p, i) => (
                        <TableRow key={i} className="even:bg-slate-50">
                          <TableCell>
                            <p className="font-medium text-sm">{p.product}</p>
                            {p.recommendation && <p className="text-xs text-slate-500 mt-0.5">{p.recommendation}</p>}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">{p.predicted_weekly_demand}</TableCell>
                          <TableCell><TrendIcon trend={p.trend} /></TableCell>
                          <TableCell><ConfidenceBadge level={p.confidence} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Restock Alerts */}
            {ai?.restock_alerts?.length > 0 && (
              <Card className="border border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600" /> Restock Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Days Left</TableHead>
                        <TableHead className="text-right">Order Qty</TableHead>
                        <TableHead>Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ai.restock_alerts.map((a, i) => (
                        <TableRow key={i} className="even:bg-slate-50">
                          <TableCell className="font-medium text-sm">{a.product}</TableCell>
                          <TableCell className="text-right tabular-nums">{a.current_stock}</TableCell>
                          <TableCell className="text-right tabular-nums">{a.estimated_days_left}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">{a.suggested_order_qty}</TableCell>
                          <TableCell><PriorityBadge priority={a.priority} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Business Insights */}
          {ai?.business_insights?.length > 0 && (
            <Card className="border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" /> Business Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {ai.business_insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <ArrowRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">{insight}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Sales Summary Table */}
          {data.sales_summary?.length > 0 && (
            <Card className="border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Sales Data (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Active Days</TableHead>
                      <TableHead className="text-right">Avg/Day</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.sales_summary.map((p, i) => (
                      <TableRow key={i} className="even:bg-slate-50">
                        <TableCell className="font-medium">{p.product}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.quantity_sold}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">₹{p.revenue?.toFixed(2)}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.days_with_sales}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.avg_daily}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-slate-400 text-center">
            Generated at {new Date(data.generated_at).toLocaleString()} using OpenAI GPT-5.2
          </p>
        </>
      )}
    </div>
  );
}
