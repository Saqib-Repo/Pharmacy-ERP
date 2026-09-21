import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowDownUp,
  Search,
  Filter,
  CheckCircle2,
  RefreshCw,
  Plus,
  Play,
  FileSpreadsheet,
  TrendingDown,
  Layers,
  Sparkles,
  DollarSign,
  Package,
  Calendar,
  Trash2,
  Sliders,
  Check,
  Building2,
  X,
} from 'lucide-react';
import { Product, Batch, StockAdjustment } from '../types';

interface InventoryViewProps {
  onOpenSheetsModal: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type InventoryTab =
  | 'all'
  | 'low_stock'
  | 'out_of_stock'
  | 'expired'
  | 'near_expiry'
  | 'batches'
  | 'adjustments'
  | 'fefo_simulator';

export const InventoryView: React.FC<InventoryViewProps> = ({
  onOpenSheetsModal,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('all');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Stock Adjustment Modal
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentTargetProduct, setAdjustmentTargetProduct] = useState<any | null>(null);
  const [adjustmentTargetBatch, setAdjustmentTargetBatch] = useState<any | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState<{
    product_id: string;
    batch_id: string;
    adjustment_type: 'Damage' | 'Expired' | 'Inventory_Audit' | 'Theft' | 'Correction';
    quantity: number;
    reason: string;
    reference: string;
  }>({
    product_id: '',
    batch_id: '',
    adjustment_type: 'Damage',
    quantity: -1,
    reason: '',
    reference: '',
  });

  // FEFO Simulator State
  const [fefoProduct, setFefoProduct] = useState<string>('PRD-001');
  const [fefoQuantity, setFefoQuantity] = useState<number>(20);
  const [fefoResult, setFefoResult] = useState<any | null>(null);
  const [fefoSimulating, setFefoSimulating] = useState(false);
  const [fefoApplying, setFefoApplying] = useState(false);

  // Near Expiry threshold filter
  const [expiryThreshold, setExpiryThreshold] = useState<number>(90);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [sumRes, prodRes, batRes] = await Promise.all([
        fetch('/api/inventory/summary').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/batches').then((r) => r.json()),
      ]);

      setSummary(sumRes);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
      setBatches(Array.isArray(batRes) ? batRes : []);

      if (Array.isArray(prodRes) && prodRes.length > 0 && !fefoProduct) {
        setFefoProduct(prodRes[0].product_id);
      }
    } catch (err: any) {
      showToast('Error querying inventory from Google Sheets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Run FEFO Simulation test
  const runFefoSimulation = async (prodId?: string, qty?: number) => {
    const targetProd = prodId || fefoProduct;
    const targetQty = qty !== undefined ? qty : fefoQuantity;
    if (!targetProd || !targetQty) return;

    setFefoSimulating(true);
    try {
      const res = await fetch('/api/inventory/simulate-fefo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: targetProd, quantity: targetQty }),
      });
      const data = await res.json();
      if (res.ok) {
        setFefoResult(data);
      } else {
        showToast(data.error || 'FEFO simulation failed', 'error');
      }
    } catch (err: any) {
      showToast('Error executing FEFO simulation', 'error');
    } finally {
      setFefoSimulating(false);
    }
  };

  // Run FEFO Simulation automatically when simulator tab opens or selection changes
  useEffect(() => {
    if (activeTab === 'fefo_simulator' && fefoProduct) {
      runFefoSimulation();
    }
  }, [activeTab, fefoProduct]);

  // Execute Actual FEFO Dispensation to test stock deduction in Google Sheets
  const applyFefoDispense = async () => {
    if (!fefoProduct || !fefoQuantity) return;
    if (!confirm(`Apply FEFO test dispense of ${fefoQuantity} units for this medicine? This will deduct the units across the earliest valid batches in your Google Sheet.`)) {
      return;
    }

    setFefoApplying(true);
    try {
      const res = await fetch('/api/inventory/apply-fefo-dispense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: fefoProduct, quantity: fefoQuantity }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        // Refresh data to reflect updated stock in Google Sheet
        await fetchInventoryData();
        await runFefoSimulation();
      } else {
        showToast(data.error || 'FEFO dispense failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error executing FEFO dispense', 'error');
    } finally {
      setFefoApplying(false);
    }
  };

  // Submit Stock Adjustment
  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentForm.product_id || !adjustmentForm.batch_id || !adjustmentForm.quantity) {
      showToast('Please specify product, batch, and quantity adjustment', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustmentForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Stock adjustment recorded in Google Sheet! New batch quantity: ${data.new_quantity}`, 'success');
        setIsAdjustmentModalOpen(false);
        fetchInventoryData();
      } else {
        showToast(data.error || 'Failed to adjust stock', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing stock adjustment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick remove of expired batch
  const handleQuickQuarantineDiscard = (batch: any) => {
    setAdjustmentForm({
      product_id: batch.product_id,
      batch_id: batch.batch_id,
      adjustment_type: 'Expired',
      quantity: -Number(batch.remaining_quantity),
      reason: `Safe clinical disposal of expired batch ${batch.batch_number} (Exp: ${batch.expiry_date})`,
      reference: 'EXPIRY-DISPOSAL-AUDIT',
    });
    setIsAdjustmentModalOpen(true);
  };

  // Filter batches by threshold
  const nearExpiryList = batches.filter((b) => {
    return !b.is_expired && b.days_to_expiry <= expiryThreshold && b.remaining_quantity > 0;
  });

  const expiredList = batches.filter((b) => b.is_expired && b.remaining_quantity > 0);
  const lowStockList = products.filter((p) => p.total_stock > 0 && p.total_stock <= (p.reorder_level || 0));
  const outOfStockList = products.filter((p) => p.total_stock === 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header with Valuation Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Inventory & FEFO Batch Engine
              </h1>
              <p className="text-xs text-slate-700">
                First-Expiry First-Out pharmaceutical tracking with live Google Sheets ledger synchronization.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setActiveTab('fefo_simulator');
                runFefoSimulation();
              }}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center space-x-1.5 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>FEFO Dispense Simulator</span>
            </button>

            <button
              onClick={() => {
                setAdjustmentForm({
                  product_id: products[0]?.product_id || '',
                  batch_id: batches[0]?.batch_id || '',
                  adjustment_type: 'Damage',
                  quantity: -1,
                  reason: 'Inventory reconciliation',
                  reference: 'AUDIT-ADJ',
                });
                setIsAdjustmentModalOpen(true);
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center space-x-1.5"
            >
              <ArrowDownUp className="w-4 h-4 text-slate-600" />
              <span>Stock Adjustment</span>
            </button>

            <button
              onClick={fetchInventoryData}
              disabled={loading}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200"
              title="Refresh from Google Sheets"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Financial Valuation & Risk Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          <div className="p-3.5 bg-slate-50/75 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Total Stock Units
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {summary?.overview?.totalUnits || 0}{' '}
              <span className="text-xs font-normal text-slate-700">units</span>
            </div>
            <div className="text-[11px] text-slate-700 mt-1 font-medium">
              Across {products.length} medicines in Google Sheets
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/75 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Stock Valuation (Cost)
            </div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              ₨ {(summary?.overview?.valuationPurchase || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1 font-medium">
              Retail: ₨ {(summary?.overview?.valuationSale || 0).toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/75 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Stock Alerts (Reorder)
            </div>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-xl font-bold text-amber-600">{lowStockList.length}</span>
              <span className="text-xs text-slate-700">Low</span>
              <span className="text-xl font-bold text-rose-600">{outOfStockList.length}</span>
              <span className="text-xs text-slate-700">Out</span>
            </div>
            <div className="text-[11px] text-slate-700 mt-1">Requires purchase orders</div>
          </div>

          <div className="p-3.5 bg-slate-50/75 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Expiry Alerts (&lt;90 Days)
            </div>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-xl font-bold text-rose-600">{expiredList.length}</span>
              <span className="text-xs text-rose-700 font-bold">Expired</span>
              <span className="text-xl font-bold text-amber-600">{nearExpiryList.length}</span>
              <span className="text-xs text-amber-700 font-bold">Near</span>
            </div>
            <div className="text-[11px] text-slate-700 mt-1">Blocked from sales by FEFO rule</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>All Medicines ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'batches'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Batch Ledger ({batches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fefo_simulator')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'fefo_simulator'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>FEFO Simulator & Stock Test</span>
        </button>

        <button
          onClick={() => setActiveTab('low_stock')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'low_stock'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock ({lowStockList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expired')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'expired'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Expired Quarantine ({expiredList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('near_expiry')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'near_expiry'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Near Expiry Watch ({nearExpiryList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('adjustments')}
          className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'adjustments'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowDownUp className="w-3.5 h-3.5" />
          <span>Adjustments & Audit Log</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ALL MEDICINES STOCK OVERVIEW                       */}
      {/* ========================================================= */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Aggregated Medicine Stock Position</h3>
            <span className="text-xs text-slate-700">Calculated across valid non-expired batches</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Dosage Form</th>
                  <th className="py-3 px-3 text-right">Cost (PKR)</th>
                  <th className="py-3 px-3 text-right">Retail (PKR)</th>
                  <th className="py-3 px-3 text-center">Active Batches</th>
                  <th className="py-3 px-3 text-center">Available Stock</th>
                  <th className="py-3 px-3 text-center">Reorder Threshold</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p, idx) => {
                  const isLow = p.total_stock > 0 && p.total_stock <= (p.reorder_level || 0);
                  const isOut = p.total_stock === 0;

                  return (
                    <tr key={`${p.product_id}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{p.product_name}</div>
                        <div className="text-[11px] text-slate-700 italic font-mono">{p.generic_name}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-700">
                        {p.dosage_form} {p.strength ? `(${p.strength})` : ''}
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium">₨ {Number(p.purchase_price).toLocaleString()}</td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">₨ {Number(p.sale_price).toLocaleString()}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-semibold text-slate-700">{p.valid_batches_count || 0}</span>
                        {p.expired_stock > 0 && (
                          <span className="text-[10px] text-rose-600 block">({p.expired_stock} in quarantine)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="text-sm font-extrabold text-slate-900">{p.total_stock}</span>{' '}
                        <span className="text-[10px] text-slate-700">{p.unit || 'Units'}</span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-700 font-medium">
                        {p.reorder_level || 10}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isOut ? (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                            Low Stock Alert
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                            Adequate Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: FEFO SIMULATOR & INTERACTIVE STOCK TEST            */}
      {/* ========================================================= */}
      {activeTab === 'fefo_simulator' && (
        <div className="space-y-5">
          {/* Simulator Control Card */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 text-white p-6 rounded-2xl shadow-lg border border-emerald-800/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-emerald-800/60">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Interactive FEFO Stock Engine</h2>
                  <p className="text-xs text-emerald-200/80">
                    Test the First-Expiry First-Out deduction algorithm on any medicine before point-of-sale dispensation.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-semibold border border-emerald-500/40">
                Rule: Earliest Valid Expiry First • Zero Expired Dispensation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 items-end">
              {/* Product Selector */}
              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1.5">
                  Select Medicine to Dispense:
                </label>
                <select
                  value={fefoProduct}
                  onChange={(e) => {
                    setFefoProduct(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-900/90 border border-emerald-600/50 rounded-xl text-xs font-medium text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                >
                  {products.map((p, idx) => (
                    <option key={`${p.product_id}-${idx}`} value={p.product_id}>
                      {p.product_name} (Stock: {p.total_stock} units)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1.5">
                  Requested Dispensation Quantity (Units):
                </label>
                <input
                  type="number"
                  min={1}
                  value={fefoQuantity}
                  onChange={(e) => setFefoQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2.5 bg-slate-900/90 border border-emerald-600/50 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => runFefoSimulation()}
                  disabled={fefoSimulating}
                  className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md disabled:opacity-50"
                >
                  {fefoSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>Calculate FEFO Split</span>
                </button>

                <button
                  onClick={applyFefoDispense}
                  disabled={fefoApplying || !fefoResult || !fefoResult.fulfilled}
                  className="py-2.5 px-4 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Deduct this quantity from Google Sheets Batches"
                >
                  {fefoApplying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Apply &amp; Deduct in Sheet</span>
                </button>
              </div>
            </div>
          </div>

          {/* FEFO Calculation Results Breakdown */}
          {fefoResult && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    FEFO Allocation Plan for {fefoResult.product.product_name}
                  </h3>
                  <p className="text-xs text-slate-700">
                    Requested: <strong>{fefoResult.requestedQuantity}</strong> units • Available Valid Stock:{' '}
                    <strong>{fefoResult.totalValidStock}</strong> units
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {fefoResult.fulfilled ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>100% Stock Fulfilled via FEFO</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Shortage of {fefoResult.shortage} units!</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Quarantined Expired Batches Warning (if any) */}
              {fefoResult.quarantinedBatches && fefoResult.quarantinedBatches.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>QUARANTINE ENFORCED: Expired Batches Automatically Bypassed</span>
                  </div>
                  <p className="text-xs text-rose-700">
                    The FEFO engine detected the following expired batches and strictly blocked them from being dispensed:
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {fefoResult.quarantinedBatches.map((qb: any) => (
                      <div key={qb.batch_id} className="text-xs font-mono bg-white p-2 rounded-lg border border-rose-200 flex justify-between">
                        <span>Batch <strong>{qb.batch_number}</strong> (Expired on {qb.expiry_date})</span>
                        <span className="text-rose-600 font-bold">{qb.remaining_quantity} units quarantined</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Chronological Deductions */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  FEFO Chronological Batch Allocations
                </h4>

                <div className="space-y-3">
                  {fefoResult.allocations.map((alloc: any, idx: number) => (
                    <div
                      key={alloc.batch_id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm font-bold text-slate-900">
                              {alloc.batch_number}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                              Exp: {alloc.expiry_date} ({alloc.days_to_expiry}d left)
                            </span>
                          </div>
                          <div className="text-xs text-slate-700 mt-0.5">
                            Stock before: <strong>{alloc.available_quantity}</strong> units → After deduction:{' '}
                            <strong className="text-slate-900">{alloc.remaining_after}</strong> units
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 self-end md:self-auto">
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-emerald-700">
                            Deduct {alloc.allocated_quantity} Units
                          </div>
                          <div className="text-[10px] text-slate-700">
                            ₨{alloc.sale_price} × {alloc.allocated_quantity} = ₨{alloc.subtotal}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calculation Summary Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="text-slate-700">
                  Total Allocated: <strong>{fefoResult.allocatedTotal}</strong> of{' '}
                  <strong>{fefoResult.requestedQuantity}</strong> units • Estimated Total Revenue:{' '}
                  <strong className="text-slate-900">₨ {fefoResult.totalAmount.toLocaleString()}</strong>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={applyFefoDispense}
                    disabled={fefoApplying || !fefoResult.fulfilled}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-xs disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm FEFO Stock Deduction to Google Sheet</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: BATCH LEDGER MASTER TABLE                          */}
      {/* ========================================================= */}
      {activeTab === 'batches' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Batch Ledger Master</h3>
            <span className="text-xs text-slate-700">Stored in Google Sheet: <strong>Batches</strong></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="py-3 px-4">Batch Number</th>
                  <th className="py-3 px-3">Medicine & Formula</th>
                  <th className="py-3 px-3">Mfg Date</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-3 text-center">Remaining Stock</th>
                  <th className="py-3 px-3 text-right">Cost (PKR)</th>
                  <th className="py-3 px-3 text-right">Price (PKR)</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-4 text-center">Expiry Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((b) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isExpired = b.expiry_date < todayStr;
                  const diffDays = b.days_to_expiry;

                  return (
                    <tr key={b.batch_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {b.batch_number}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900">{b.product_name}</div>
                        <div className="text-[10px] text-slate-700 italic">{b.generic_name}</div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-700">{b.manufacturing_date}</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{b.expiry_date}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-extrabold text-sm text-slate-900">{b.remaining_quantity}</span>{' '}
                        <span className="text-[10px] text-slate-700">/ {b.quantity}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium">₨ {b.purchase_price}</td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">₨ {b.sale_price}</td>
                      <td className="py-3.5 px-3 text-slate-700">{b.supplier_name}</td>
                      <td className="py-3.5 px-4 text-center">
                        {isExpired ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md">
                            EXPIRED (Quarantined)
                          </span>
                        ) : diffDays <= 30 ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                            Expires in {diffDays}d
                          </span>
                        ) : diffDays <= 60 ? (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-bold rounded-md">
                            Expires in {diffDays}d
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                            Valid ({diffDays}d left)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setAdjustmentForm({
                              product_id: b.product_id,
                              batch_id: b.batch_id,
                              adjustment_type: isExpired ? 'Expired' : 'Damage',
                              quantity: -1,
                              reason: isExpired ? 'Expired removal' : 'Damaged strip removal',
                              reference: 'MANUAL-DISPOSAL',
                            });
                            setIsAdjustmentModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: EXPIRED QUARANTINE                                */}
      {/* ========================================================= */}
      {activeTab === 'expired' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
              <div>
                <h3 className="text-sm font-bold text-rose-900">Quarantined Expired Stock</h3>
                <p className="text-xs text-rose-700">
                  Medicines past their expiration date are strictly prohibited from point of sale dispensation by Pakistan DRAP guidelines.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {expiredList.length === 0 ? (
              <div className="text-center py-12 text-slate-700 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-sm">No Expired Stock!</p>
                <p className="mt-1">All active batches in your pharmacy are currently within their shelf-life validity.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expiredList.map((batch) => (
                  <div key={batch.batch_id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{batch.product_name}</span>
                        <span className="font-mono text-xs text-slate-700 font-semibold">[{batch.batch_number}]</span>
                        <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-md">
                          EXPIRED ON {batch.expiry_date}
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 mt-1">
                        Formula: {batch.generic_name} • Supplier: {batch.supplier_name}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-rose-600">{batch.remaining_quantity} units trapped</div>
                        <div className="text-[10px] text-slate-700">Valuation: ₨{(Number(batch.remaining_quantity) * Number(batch.purchase_price)).toLocaleString()}</div>
                      </div>

                      <button
                        onClick={() => handleQuickQuarantineDiscard(batch)}
                        className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Dispose &amp; Write Off</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: NEAR EXPIRY WATCH                                  */}
      {/* ========================================================= */}
      {activeTab === 'near_expiry' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Near Expiry Early Warning</h3>
              <p className="text-xs text-slate-700">Prioritize these batches for dispensation or supplier credit return</p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-700 font-medium">Alert Window:</span>
              <button
                onClick={() => setExpiryThreshold(30)}
                className={`px-2.5 py-1 rounded-lg font-bold ${
                  expiryThreshold === 30 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                &lt;30 Days
              </button>
              <button
                onClick={() => setExpiryThreshold(60)}
                className={`px-2.5 py-1 rounded-lg font-bold ${
                  expiryThreshold === 60 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                &lt;60 Days
              </button>
              <button
                onClick={() => setExpiryThreshold(90)}
                className={`px-2.5 py-1 rounded-lg font-bold ${
                  expiryThreshold === 90 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                &lt;90 Days
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
            {nearExpiryList.map((batch) => (
              <div key={batch.batch_id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{batch.product_name}</span>
                    <span className="font-mono text-xs text-slate-700">[{batch.batch_number}]</span>
                    <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-md">
                      Expires in {batch.days_to_expiry} days ({batch.expiry_date})
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 mt-1">
                    {batch.generic_name} • Supplier: {batch.supplier_name}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">{batch.remaining_quantity} units remaining</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Automatic 1st pick by FEFO rule</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: LOW STOCK REORDER ALERTS                           */}
      {/* ========================================================= */}
      {activeTab === 'low_stock' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Low Stock Reorder Triggers</h3>
            <span className="text-xs text-amber-600 font-semibold">{lowStockList.length} items at or below reorder level</span>
          </div>

          <div className="divide-y divide-slate-100">
            {lowStockList.map((p, idx) => (
              <div key={`${p.product_id}-${idx}`} className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{p.product_name}</div>
                  <div className="text-xs text-slate-700 italic">{p.generic_name} • Mfg: {p.manufacturer}</div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-bold text-amber-600">
                      Current: {p.total_stock} {p.unit || 'Units'}
                    </div>
                    <div className="text-[10px] text-slate-700">Reorder Threshold: {p.reorder_level}</div>
                  </div>

                  <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg">
                    Purchase Needed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: ADJUSTMENTS & AUDIT LOG                            */}
      {/* ========================================================= */}
      {activeTab === 'adjustments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Stock Adjustments &amp; Inventory Audit Log</h3>
              <p className="text-xs text-slate-700">Logged to Google Sheet: <strong>Stock_Adjustments</strong> &amp; <strong>Audit_Logs</strong></p>
            </div>
            <button
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Adjustment</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-700 uppercase">
                <tr>
                  <th className="py-3 px-4">Adjustment ID</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Batch ID</th>
                  <th className="py-3 px-3 text-right">Quantity Change</th>
                  <th className="py-3 px-3">Reason / Clinical Note</th>
                  <th className="py-3 px-3">Adjusted By</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!summary?.recentAdjustments || summary.recentAdjustments.length === 0) ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-700">
                      No stock adjustments recorded yet.
                    </td>
                  </tr>
                ) : (
                  summary.recentAdjustments.map((adj: any) => (
                    <tr key={adj.adjustment_id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{adj.adjustment_id}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {adj.adjustment_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">{adj.batch_id}</td>
                      <td className="py-3 px-3 text-right font-bold">
                        <span className={Number(adj.quantity) < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {Number(adj.quantity) > 0 ? `+${adj.quantity}` : adj.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{adj.reason}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{adj.created_by}</td>
                      <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-700">
                        {adj.created_at ? new Date(adj.created_at).toLocaleString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: STOCK ADJUSTMENT FORM                              */}
      {/* ========================================================= */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">Record Stock Adjustment</h3>
              <button onClick={() => setIsAdjustmentModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Medicine *</label>
                <select
                  value={adjustmentForm.product_id}
                  onChange={(e) => {
                    const pId = e.target.value;
                    const b = batches.find((x) => x.product_id === pId);
                    setAdjustmentForm({
                      ...adjustmentForm,
                      product_id: pId,
                      batch_id: b?.batch_id || '',
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {products.map((p, idx) => (
                    <option key={`${p.product_id}-${idx}`} value={p.product_id}>
                      {p.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Batch *</label>
                <select
                  value={adjustmentForm.batch_id}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, batch_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                >
                  {batches
                    .filter((b) => !adjustmentForm.product_id || b.product_id === adjustmentForm.product_id)
                    .map((b) => (
                      <option key={b.batch_id} value={b.batch_id}>
                        {b.batch_number} (Avail: {b.remaining_quantity} | Exp: {b.expiry_date})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Type</label>
                  <select
                    value={adjustmentForm.adjustment_type}
                    onChange={(e) =>
                      setAdjustmentForm({
                        ...adjustmentForm,
                        adjustment_type: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Damage">Damage / Broken</option>
                    <option value="Expired">Expired Stock Removal</option>
                    <option value="Inventory_Audit">Audit Reconciliation</option>
                    <option value="Theft">Theft / Shrinkage</option>
                    <option value="Correction">Correction / Free Sample</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Change (+/-)</label>
                  <input
                    type="number"
                    required
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Note *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken vial during transit, periodic audit discrepancy"
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Google Sheet Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
