import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Truck,
  Boxes,
  Pill,
  Tag,
  Users,
  Building2,
  UserCheck,
  CreditCard,
  DollarSign,
  BarChart3,
  ShieldCheck,
  Settings,
  Database,
  AlertTriangle,
} from 'lucide-react';
import { UserRole } from '../types';

export type NavItemKey =
  | 'Dashboard'
  | 'POS'
  | 'Sales'
  | 'Purchases'
  | 'Inventory'
  | 'Products'
  | 'Categories'
  | 'Customers'
  | 'Suppliers'
  | 'Employees'
  | 'Expenses'
  | 'Payments'
  | 'Reports'
  | 'Users & Roles'
  | 'Settings';

interface SidebarProps {
  currentNav: NavItemKey;
  onSelectNav: (nav: NavItemKey) => void;
  userRole: UserRole;
  isSheetsConnected: boolean;
  onOpenSheetsModal: () => void;
  expiryAlertCount: number;
}

interface NavItemConfig {
  key: NavItemKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: UserRole[];
  badge?: string | number;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onSelectNav,
  userRole,
  isSheetsConnected,
  onOpenSheetsModal,
  expiryAlertCount,
}) => {
  const navItems: NavItemConfig[] = [
    { key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'POS', label: 'Point of Sale (POS)', icon: ShoppingCart },
    { key: 'Sales', label: 'Sales Invoices', icon: Receipt },
    { key: 'Purchases', label: 'Purchases', icon: Truck },
    {
      key: 'Inventory',
      label: 'FEFO Inventory',
      icon: Boxes,
      badge: expiryAlertCount > 0 ? `${expiryAlertCount} Alerts` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    { key: 'Products', label: 'Products & Drugs', icon: Pill },
    { key: 'Categories', label: 'Categories', icon: Tag },
    { key: 'Customers', label: 'Customers', icon: Users },
    { key: 'Suppliers', label: 'Suppliers', icon: Building2 },
    { key: 'Employees', label: 'Employees', icon: UserCheck },
    { key: 'Expenses', label: 'Expenses', icon: CreditCard },
    { key: 'Payments', label: 'Payments & Ledgers', icon: DollarSign },
    { key: 'Reports', label: 'Reports & Analytics', icon: BarChart3 },
    { key: 'Users & Roles', label: 'Users & Roles', icon: ShieldCheck },
    { key: 'Settings', label: 'ERP Settings', icon: Settings },
  ];

  return (
    <aside
      id="pharmapulse-sidebar"
      className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shrink-0 select-none"
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-teal-500/20">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="text-white font-bold tracking-tight text-base flex items-center gap-1.5">
              PharmaPulse
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ERP
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">v1.0 • Pakistan</div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Operations
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentNav === item.key;

          return (
            <button
              key={item.key}
              id={`nav-item-${item.key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => onSelectNav(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Google Sheets Database Status Card at Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <button
          id="sidebar-sheets-status-btn"
          onClick={onOpenSheetsModal}
          className="w-full p-2.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 transition-all text-left group flex items-start space-x-3"
        >
          <div className="mt-0.5 p-1.5 rounded bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 border border-emerald-500/20 shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white truncate">Google Sheets DB</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isSheetsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {isSheetsConnected ? 'Connected & Verified' : 'Click to Configure'}
            </p>
          </div>
        </button>
      </div>
    </aside>
  );
};
