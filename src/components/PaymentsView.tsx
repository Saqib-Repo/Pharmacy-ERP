import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Building2,
  User,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Payment } from '../types';

interface PaymentsViewProps {
  onOpenSheetsModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  showToast,
}) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refFilter, setRefFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    reference_type: 'Customer_Adjustment' as any,
    reference_id: '',
    party_type: 'Customer' as any,
    party_id: '',
    amount: 1000,
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast('Error loading payments: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      showToast('Amount must be greater than zero', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || (!data.success && !data.payment)) {
        throw new Error(data.error || 'Failed to record payment');
      }

      showToast('Payment ledger entry created in Google Sheets!', 'success');
      setIsModalOpen(false);
      loadPayments();
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (p.reference_id && p.reference_id.toLowerCase().includes(q)) ||
      (p.party_id && p.party_id.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q));

    const matchesRef = refFilter === 'All' || p.reference_type === refFilter;
    return matchesSearch && matchesRef;
  });

  const totalInflow = payments
    .filter((p) => p.reference_type === 'Sale' || p.reference_type === 'Customer_Adjustment')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalOutflow = payments
    .filter((p) => p.reference_type === 'Purchase' || p.reference_type === 'Expense')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div id="payments-ledger-view" className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Cash & Bank Settlement Ledger</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit patient receipts, distributor payouts, bank transfers, and adjustments recorded in Google Sheets.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadPayments}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            id="create-payment-entry-btn"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record Ledger Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Customer Cash & Digital Inflow</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            PKR {totalInflow.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Collections from sales & patients</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Distributor & Expense Outflow</span>
          <div className="text-xl font-bold text-rose-700 mt-1">
            PKR {totalOutflow.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Payments to suppliers & bills</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Net Settlement Flow</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            PKR {(totalInflow - totalOutflow).toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
            {payments.length} Transaction logs
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pb-3 flex items-center space-x-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by party, reference ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={refFilter}
          onChange={(e) => setRefFilter(e.target.value)}
          className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="All">All Reference Types</option>
          <option value="Sale">Sale Invoices</option>
          <option value="Purchase">Supplier Purchases</option>
          <option value="Expense">Operating Expenses</option>
          <option value="Customer_Adjustment">Customer Khata Adjustment</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Reference ID</th>
                <th className="py-3 px-4">Party</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Voucher Notes</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading payments from Google Sheets...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No payment entries found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isInflow = p.reference_type === 'Sale' || p.reference_type === 'Customer_Adjustment';
                  return (
                    <tr key={p.payment_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-600">{p.payment_date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isInflow
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.reference_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.reference_id}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {p.party_id || p.party_type}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.payment_method}</td>
                      <td className="py-3 px-4 text-slate-500 italic">{p.notes || '-'}</td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          isInflow ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isInflow ? '+' : '-'} PKR {Number(p.amount).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Record Ledger Settlement Entry</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Reference Type</label>
                  <select
                    value={formData.reference_type}
                    onChange={(e) => setFormData({ ...formData, reference_type: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Customer_Adjustment">Customer Khata Settlement</option>
                    <option value="Supplier_Adjustment">Supplier Payment</option>
                    <option value="Expense">Expense Payment</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Party / Customer / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formData.party_id}
                  onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
                  placeholder="e.g. Dr. Salman Qureshi / GSK Pakistan"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Amount (PKR) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="JazzCash">JazzCash</option>
                    <option value="Easypaisa">Easypaisa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Notes / Voucher Reference</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Khata cleared for August"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Post Settlement</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
