import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UISettingsProvider } from '@/contexts/UISettingsContext';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import MFASetupPage from '@/pages/MFASetupPage';
import DashboardPage from '@/pages/DashboardPage';
import InventoryPage from '@/pages/InventoryPage';
import POSPage from '@/pages/POSPage';
import ReportsPage from '@/pages/ReportsPage';
import UsersPage from '@/pages/UsersPage';
import SettingsPage from '@/pages/SettingsPage';
import AuditLogsPage from '@/pages/AuditLogsPage';
import ForecastPage from '@/pages/ForecastPage';
import PurchasesPage from '@/pages/PurchasesPage';
import MobileScannerPage from '@/pages/MobileScannerPage';
import CustomersPage from '@/pages/CustomersPage';
import APIKeysPage from '@/pages/APIKeysPage';
import SupportTicketsPage from '@/pages/SupportTicketsPage';
import SecurityAlertsPage from '@/pages/SecurityAlertsPage';
import PlatformAdminPage from '@/pages/PlatformAdminPage';
import AccessRequestsPage from '@/pages/AccessRequestsPage';
import PromoCodesPage from '@/pages/PromoCodesPage';
import ReorderPage from '@/pages/ReorderPage';
import AdvanceOrdersPage from '@/pages/AdvanceOrdersPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import RefillPredictionsPage from '@/pages/RefillPredictionsPage';
import PublicReceiptPage from '@/pages/PublicReceiptPage';
import '@/App.css';

function ProtectedRoute({ children, roles, adminAccess }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-slate-900"><div className="text-slate-500 dark:text-slate-400 font-heading">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mfa_setup_required) return <Navigate to="/mfa-setup" replace />;
  // Admin and platform admin bypass role checks for adminAccess routes
  if (adminAccess && (user.is_admin || user.is_platform_admin)) {
    return <Layout>{children}</Layout>;
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
}

function MFASetupRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-slate-900"><div className="text-slate-500 dark:text-slate-400 font-heading">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.mfa_setup_required) return <Navigate to="/dashboard" replace />;
  return <MFASetupPage />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-slate-900"><div className="text-slate-500 dark:text-slate-400 font-heading">Loading...</div></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/mfa-setup" element={<MFASetupRoute />} />
      <Route path="/scan/:sessionId" element={<MobileScannerPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
      <Route path="/pos" element={<ProtectedRoute><POSPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/forecast" element={<ProtectedRoute><ForecastPage /></ProtectedRoute>} />
      <Route path="/purchases" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={['OWNER', 'MANAGER']}><UsersPage /></ProtectedRoute>} />
      <Route path="/audit-logs" element={<ProtectedRoute roles={['OWNER', 'MANAGER']}><AuditLogsPage /></ProtectedRoute>} />
      <Route path="/api-keys" element={<ProtectedRoute roles={['OWNER']}><APIKeysPage /></ProtectedRoute>} />
      <Route path="/support" element={<ProtectedRoute><SupportTicketsPage /></ProtectedRoute>} />
      <Route path="/security-alerts" element={<ProtectedRoute roles={['OWNER', 'MANAGER']}><SecurityAlertsPage /></ProtectedRoute>} />
      <Route path="/platform-admin" element={<ProtectedRoute adminAccess><PlatformAdminPage /></ProtectedRoute>} />
      <Route path="/access-requests" element={<ProtectedRoute roles={['OWNER']} adminAccess><AccessRequestsPage /></ProtectedRoute>} />
      <Route path="/promo-codes" element={<ProtectedRoute roles={['OWNER', 'MANAGER']}><PromoCodesPage /></ProtectedRoute>} />
      <Route path="/reorder" element={<ProtectedRoute roles={['OWNER', 'MANAGER']}><ReorderPage /></ProtectedRoute>} />
      <Route path="/advance-orders" element={<ProtectedRoute><AdvanceOrdersPage /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute adminAccess><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/refill-predictions" element={<ProtectedRoute roles={['OWNER', 'MANAGER']}><RefillPredictionsPage /></ProtectedRoute>} />
      <Route path="/receipt/:shareToken" element={<PublicReceiptPage />} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <UISettingsProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </UISettingsProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
