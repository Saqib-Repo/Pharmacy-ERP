import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Package,
  Layers,
  Printer,
  RefreshCw,
  PieChart,
  Calendar,
} from 'lucide-react';

interface ReportsViewProps {
  onOpenSheetsModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  showToast,
}) => {
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/summary');
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      showToast('Error loading financial reports: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const financial = report?.financial || {
    totalRevenue: 0,
    totalPurchases: 0,
    totalExpenses: 0,
    grossProfit: 0,
    netProfit: 0,
    profitMarginPercent: 0,
  };

  const inventory = report?.inventoryValuation || {
    totalActiveUnits: 0,
    totalCostValuation: 0,
    totalRetailValuation: 0,
    potentialMargin: 0,
  };

  const expiry = report?.expiryRisk || {
    expiredBatches: 0,
    expiredLossValue: 0,
    expiring30DaysBatches: 0,
    expiring30DaysValue: 0,
  };

  return (
    <div id="reports-analytics-view" className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">
              Executive Financial & Inventory Reports
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time accounting, FEFO valuation, gross margin analysis, and expiry risk calculated from Google Sheets.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadReport}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh Reports"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Financial Statement</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading ? (
          <div className="py-24 text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />
            Calculating live financial metrics from all 18 Google Sheets tabs...
          </div>
        ) : (
          <>
            {/* Financial Performance Grid */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                1. Profit & Loss Summary (P&L)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Total Counter Revenue</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    PKR {Number(financial.totalRevenue).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
                    From POS sales invoices
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Inward Purchases Value</span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    PKR {Number(financial.totalPurchases).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 inline-block">
                    Stock consignments from distributors
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Operating Overhead Expenses</span>
                  <div className="text-2xl font-bold text-rose-700 mt-1">
                    PKR {Number(financial.totalExpenses).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 inline-block">
                    Utilities, diesel, supplies
                  </span>
                </div>

                <div className="bg-emerald-900 text-white p-4 rounded-xl border border-emerald-800 shadow-xs">
                  <span className="text-xs text-emerald-300 font-medium">Estimated Net Margin</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    PKR {Number(financial.netProfit).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-300 font-semibold mt-1 inline-block">
                    {financial.profitMarginPercent}% Net Margin
                  </span>
                </div>
              </div>
            </div>

            {/* Inventory Valuation & FEFO Health */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                2. Live Pharmacy Inventory Valuation
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1 font-medium">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <span>Total Active Stock Units</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {Number(inventory.totalActiveUnits).toLocaleString()} Units
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Across all shelf batches</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1 font-medium">
                    <DollarSign className="w-4 h-4 text-slate-600" />
                    <span>Cost Basis Valuation (Purchase Price)</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    PKR {Number(inventory.totalCostValuation).toLocaleString()}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Actual capital tied up in stock</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1 font-medium">
                    <TrendingUp className="w-4 h-4 text-emerald-700" />
                    <span>Retail Market Value (Expected Sales)</span>
                  </div>
                  <div className="text-xl font-bold text-emerald-700">
                    PKR {Number(inventory.totalRetailValuation).toLocaleString()}
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    Unrealized Margin: PKR {Number(inventory.potentialMargin).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Expiry Loss & FEFO Risk Analysis */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                3. FEFO Expiry Risk & Dead Capital Audit
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs flex items-start space-x-3">
                  <div className="p-2.5 bg-rose-100 text-rose-800 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-rose-800 font-bold uppercase">
                      Expired Stock (Non-Saleable)
                    </span>
                    <div className="text-xl font-bold text-rose-700 mt-0.5">
                      PKR {Number(expiry.expiredLossValue).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {expiry.expiredBatches} batches past expiry date. Return to distributor for
                      credit note.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-start space-x-3">
                  <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-amber-800 font-bold uppercase">
                      Imminent Expiry Risk (&lt; 30 Days)
                    </span>
                    <div className="text-xl font-bold text-amber-700 mt-0.5">
                      PKR {Number(expiry.expiring30DaysValue).toLocaleString()}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      {expiry.expiring30DaysBatches} batches expiring within a month. Prioritize in
                      FEFO dispensing or exchange.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products & Categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Selling Products */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Top Dispensed Medicines by Revenue
                </h3>
                <div className="divide-y divide-slate-100 text-xs">
                  {report?.topSellingProducts && report.topSellingProducts.length > 0 ? (
                    report.topSellingProducts.map((p: any, idx: number) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[10px] text-slate-500">
                            Units Dispensed: {p.quantity}
                          </div>
                        </div>
                        <div className="text-right font-bold text-slate-900">
                          PKR {Number(p.amount).toLocaleString()}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-slate-400">No sales recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Therapeutic Category Breakdown
                </h3>
                <div className="space-y-3 text-xs">
                  {report?.categoryBreakdown && report.categoryBreakdown.length > 0 ? (
                    report.categoryBreakdown.map((cat: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>{cat.category}</span>
                          <span>PKR {Number(cat.amount).toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(10, (cat.amount / (financial.totalRevenue || 1)) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-slate-400">No categories recorded.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
