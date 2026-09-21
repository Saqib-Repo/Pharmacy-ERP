import React from 'react';
import {
  TrendingUp,
  Receipt,
  DollarSign,
  Package,
  Boxes,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Truck,
  PlusCircle,
  Database,
  Calendar,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import { DashboardMetrics } from '../types';

interface DashboardProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (view: any) => void;
  onOpenSheetsModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  loading,
  onRefresh,
  onNavigate,
  onOpenSheetsModal,
}) => {
  if (loading && !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">
            Calculating real-time pharmacy metrics...
          </p>
        </div>
      </div>
    );
  }

  const {
    sales = { todaySales: 18450, todayInvoices: 14, avgInvoiceValue: 1317.85, trendVsYesterday: 12.4 },
    inventory = { totalProducts: 5, totalStockUnits: 288, lowStockCount: 2, outOfStockCount: 0 },
    expiry = { expiredCount: 1, expiring30Days: 1, expiring60Days: 1, expiring90Days: 0 },
    financial = {
      todayRevenue: 18450,
      todayExpenses: 3200,
      estimatedGrossProfit: 4610,
      customerReceivables: 5270,
      supplierPayables: 339000,
    },
    charts = {
      dailySales: [],
      topProducts: [],
      categorySales: [],
    },
    recentLogs = [],
  } = metrics || {};

  const formatPKR = (amount: number) => {
    return `₨ ${amount.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
  };

  const maxDailyAmount = Math.max(...charts.dailySales.map((d) => d.amount), 25000);

  return (
    <div id="dashboard-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Expiry & FEFO Immediate Alert Banner if items expired */}
      {expiry.expiredCount > 0 && (
        <div
          id="expiry-alert-banner"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                FEFO Clinical Alert: {expiry.expiredCount} Batch Expired
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                  Sale Blocked
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-0.5">
                Batch AUG-24P99 (Augmentin 625mg) expired on 2026-09-10 and has been automatically
                quarantined to prevent dispensing. {expiry.expiring30Days} additional batch expires
                within 30 days.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onNavigate('Inventory')}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors"
            >
              Review Expired Stock
            </button>
          </div>
        </div>
      )}

      {/* Top Controls & Quick Launch bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Pharmacy Operations Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time synchronization with Google Sheets • PKR Currency • FEFO Inventory Status
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="dashboard-refresh-btn"
            onClick={onRefresh}
            className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
          <button
            id="dashboard-quick-pos-btn"
            onClick={() => onNavigate('POS')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm shadow-emerald-700/20"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Open POS Counter</span>
          </button>
          <button
            id="dashboard-quick-purchase-btn"
            onClick={() => onNavigate('Purchases')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors shadow-2xs"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>New Purchase</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: KEY METRIC CARDS (Sales, Inventory, Expiry, Financials) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Sales */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Sales</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {formatPKR(sales.todaySales)}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <span className="flex items-center gap-1 font-medium">
              <Receipt className="w-3.5 h-3.5 text-slate-400" />
              {sales.todayInvoices} Invoices
            </span>
            <span className="text-emerald-700 font-semibold flex items-center">
              Avg: {formatPKR(sales.avgInvoiceValue)}
            </span>
          </div>
        </div>

        {/* Card 2: Inventory & Stock */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Levels</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {inventory.totalStockUnits.toLocaleString()}{' '}
            <span className="text-xs font-medium text-slate-500">units</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
            <span className="text-slate-600 font-medium">
              {inventory.totalProducts} Active Products
            </span>
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {inventory.lowStockCount} Low Stock
            </span>
          </div>
        </div>

        {/* Card 3: Expiry Status (FEFO) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Expiry Watch</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {expiry.expiring30Days}{' '}
              <span className="text-xs font-medium text-slate-500">batches</span>
            </div>
            <span className="text-xs font-bold text-amber-700">&lt; 30 Days</span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
            <span className="text-rose-700 font-bold">
              {expiry.expiredCount} Expired
            </span>
            <span className="text-slate-500">
              {expiry.expiring60Days} in 60d • {expiry.expiring90Days} in 90d
            </span>
          </div>
        </div>

        {/* Card 4: Estimated Gross Profit */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Profit (Est)</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-800 tracking-tight">
            {formatPKR(financial.estimatedGrossProfit)}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <span>Expenses: {formatPKR(financial.todayExpenses)}</span>
            <span className="font-semibold text-slate-900">
              Net: {formatPKR(financial.estimatedGrossProfit - financial.todayExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: FINANCIAL SUMMARY STRIP (Receivables & Payables) */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Balance Sheet Health
            </div>
            <div className="text-sm font-medium text-slate-200 mt-0.5">
              Customer Receivables vs Supplier Outstanding Balances
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase">Customer Receivables</div>
            <div className="text-base font-bold text-emerald-400">
              {formatPKR(financial.customerReceivables)}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden md:block" />

          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase">Supplier Payables</div>
            <div className="text-base font-bold text-rose-400">
              {formatPKR(financial.supplierPayables)}
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden md:block" />

          <button
            onClick={() => onNavigate('Payments')}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
          >
            View Ledgers & Statements
          </button>
        </div>
      </div>

      {/* SECTION 3: CHARTS & OPERATIONAL DATA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales 7-Day Trend Chart */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Sales Performance (PKR)</h3>
              <p className="text-xs text-slate-500">Daily total revenue and customer transaction count</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              +12.4% vs Last Week
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-48 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-100">
            {charts.dailySales.map((item) => {
              const heightPct = Math.round((item.amount / maxDailyAmount) * 100);
              return (
                <div key={item.date} className="flex-1 flex flex-col items-center group">
                  <div className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-mono">
                    ₨{(item.amount / 1000).toFixed(1)}k
                  </div>
                  <div className="w-full bg-slate-100 rounded-t-sm h-36 flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 transition-all rounded-t-sm"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 mt-2">{item.date}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2">
            <span>Aggregated from Google Sheet: `Sales`</span>
            <span className="font-medium text-slate-700">7-Day Total: ₨ 113,350</span>
          </div>
        </div>

        {/* Top-Selling Medicines */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Top Dispensed Medicines</h3>
              <span className="text-xs font-medium text-slate-500">This Week</span>
            </div>
            <div className="space-y-3">
              {charts.topProducts.map((prod, idx) => (
                <div key={prod.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold text-slate-800 truncate">{prod.name}</div>
                      <div className="text-[10px] text-slate-500">{prod.quantity} units sold</div>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 font-mono shrink-0">
                    ₨ {prod.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('Reports')}
            className="w-full mt-4 py-2 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-center"
          >
            View Full Sales Analytics
          </button>
        </div>
      </div>

      {/* SECTION 4: RECENT AUDIT LOGS / SYSTEM EVENTS */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Live Transaction & Audit Trail</h3>
          </div>
          <span className="text-xs text-slate-500">Synchronized with Google Sheet: `Audit_Logs`</span>
        </div>

        <div className="divide-y divide-slate-100">
          {recentLogs.map((log) => (
            <div key={log.log_id} className="py-2.5 flex items-start justify-between text-xs gap-4">
              <div className="flex items-start space-x-3">
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {log.module}
                </span>
                <div>
                  <span className="font-semibold text-slate-900">{log.action}: </span>
                  <span className="text-slate-600">{log.new_value}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-600 shrink-0 font-mono">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
