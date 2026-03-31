import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUISettings } from '@/contexts/UISettingsContext';
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3, Users, Settings,
  ChevronLeft, ChevronRight, LogOut, Shield, ScrollText, Store, Brain, Truck,
  UserCheck, Key, Moon, Sun, TicketCheck, ShieldAlert, Building2, KeyRound,
  Tag, RefreshCw, CreditCard, Menu, Activity, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Package, label: 'Inventory', tenantOnly: true },
  { to: '/pos', icon: ShoppingCart, label: 'POS / Billing', tenantOnly: true },
  { to: '/purchases', icon: Truck, label: 'Purchases', tenantOnly: true },
  { to: '/customers', icon: UserCheck, label: 'Customers', tenantOnly: true },
  { to: '/reports', icon: BarChart3, label: 'Reports', tenantOnly: true },
  { to: '/analytics', icon: Activity, label: 'Analytics', roles: ['OWNER', 'MANAGER'], showForAdmin: true },
  { to: '/forecast', icon: Brain, label: 'AI Forecast', plans: ['premium', 'standard'], tenantOnly: true },
  { to: '/promo-codes', icon: Tag, label: 'Promo Codes', plans: ['premium'], tenantOnly: true },
  { to: '/reorder', icon: RefreshCw, label: 'Auto Reorder', plans: ['premium'], roles: ['OWNER', 'MANAGER'], tenantOnly: true },
  { to: '/advance-orders', icon: CreditCard, label: 'Advance Orders', plans: ['premium'], tenantOnly: true },
  { to: '/refill-predictions', icon: Bell, label: 'Refill Reminders', roles: ['OWNER', 'MANAGER'], tenantOnly: true },
  { to: '/users', icon: Users, label: 'Users', roles: ['OWNER', 'MANAGER'], tenantOnly: true },
  { to: '/security-alerts', icon: ShieldAlert, label: 'Security', roles: ['OWNER', 'MANAGER'], tenantOnly: true },
  { to: '/support', icon: TicketCheck, label: 'Support', showForAdmin: true },
  { to: '/access-requests', icon: KeyRound, label: 'Access Requests', roles: ['OWNER'], showForAdmin: true },
  { to: '/audit-logs', icon: ScrollText, label: 'Audit Logs', roles: ['OWNER', 'MANAGER'], tenantOnly: true },
  { to: '/api-keys', icon: Key, label: 'API Keys', roles: ['OWNER'], tenantOnly: true },
  { to: '/platform-admin', icon: Building2, label: 'Platform Admin', adminOrPlatform: true },
  { to: '/settings', icon: Settings, label: 'Settings', tenantOnly: true },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings, toggleSidebar } = useUISettings();
  const location = useLocation();
  const isPOS = location.pathname === '/pos';
  
  const collapsed = settings.sidebar.collapsed;

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (settings.sidebar.autoCollapseOnMobile && window.innerWidth < 768) {
        if (!collapsed) {
          toggleSidebar();
        }
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA] dark:bg-slate-900 transition-colors">
      <aside
        data-testid="sidebar"
        className={`flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all duration-150 ease-in-out ${
          collapsed ? 'w-16' : 'w-60'
        } ${isPOS ? 'hidden md:flex' : 'flex'}`}
      >
        <div className="flex items-center gap-2 px-4 h-14 border-b border-slate-200 dark:border-slate-700">
          <Store className="h-6 w-6 text-blue-600 shrink-0" />
          {!collapsed && (
            <span className="font-heading font-bold text-lg text-slate-900 dark:text-white truncate">
              RetailPro
            </span>
          )}
          {collapsed && (
            <button
              onClick={toggleSidebar}
              className="ml-auto p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
              title="Expand sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {(() => {
            const renderNavItem = (item) => (
              <NavLink
                key={item.to}
                to={item.to}
                data-testid={`nav-${item.label.toLowerCase().replace(/[\s\/]/g, '-')}`}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
                title={collapsed ? item.label : ''}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );

            return navItems.map(item => {
            const isAdmin = user?.is_admin;
            const isPlatformAdmin = user?.is_platform_admin;
            const isProductSide = isAdmin || isPlatformAdmin;

            // adminOrPlatform items: show for both admin and platform admin only
            if (item.adminOrPlatform && !isProductSide) return null;

            // For product-side users (admin/platform admin), only show relevant items
            if (isProductSide) {
              // Show: Dashboard, Analytics, Platform Admin, Support, Access Requests
              if (item.adminOrPlatform || item.showForAdmin) return renderNavItem(item);
              if (item.to === '/dashboard') return renderNavItem(item);
              // Hide tenant-specific items for product-side users
              return null;
            }

            // Regular tenant users (OWNER, MANAGER, STAFF)
            if (item.tenantOnly === false) return null;
            if (item.roles && !item.roles.includes(user?.role)) return null;
            if (item.plans && !item.plans.includes(user?.plan)) return null;

            return renderNavItem(item);
          });
          })()}
        </nav>

        <Separator className="dark:border-slate-700" />
        <div className="p-2 space-y-1">
          <button
            data-testid="theme-toggle-btn"
            onClick={toggleTheme}
            className="flex items-center justify-center w-full py-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && <span className="ml-2 text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            data-testid="sidebar-collapse-btn"
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full py-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="ml-2 text-sm">Collapse</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h2 className="font-heading font-semibold text-slate-900 dark:text-white text-lg">{user?.shop_name || 'RetailPro'}</h2>
            <span className="text-xs font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">{user?.plan}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user?.mfa_enabled && <Shield className="h-4 w-4 text-green-600" />}
              <span className="text-sm text-slate-600 dark:text-slate-300">{user?.name}</span>
              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-medium">{user?.role}</span>
            </div>
            <Button
              data-testid="logout-btn"
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className={`flex-1 overflow-auto ${isPOS ? 'p-0' : 'p-6'}`}>
          {children}
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
