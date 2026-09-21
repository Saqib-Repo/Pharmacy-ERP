import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  Calendar,
  FileText,
  Trash2,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Expense } from '../types';

interface ExpensesViewProps {
  onOpenSheetsModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  showToast,
}) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: 'Utilities',
    description: '',
    amount: 5000,
    payment_method: 'Cash',
    employee_id: 'EMP-001',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast('Error loading expenses: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const openCreateModal = () => {
    setFormData({
      expense_date: new Date().toISOString().split('T')[0],
      category: 'Utilities',
      description: '',
      amount: 5000,
      payment_method: 'Cash',
      employee_id: 'EMP-001',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || formData.amount <= 0) {
      showToast('Please provide a description and positive expense amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || (!data.success && !data.expense)) {
        throw new Error(data.error || 'Failed to record expense');
      }

      showToast('Expense voucher recorded in Google Sheets!', 'success');
      setIsModalOpen(false);
      loadExpenses();
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, desc: string) => {
    if (!confirm(`Are you sure you want to void expense voucher: ${desc}?`)) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Expense voucher removed', 'info');
        loadExpenses();
      }
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      exp.description.toLowerCase().includes(q) ||
      (exp.notes && exp.notes.toLowerCase().includes(q));

    const matchesCat = catFilter === 'All' || exp.category === catFilter;
    return matchesSearch && matchesCat;
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div id="expenses-ledger-view" className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Pharmacy Operating Expenses</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Log store overheads, electricity, generator diesel, thermal rolls, and petty cash vouchers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadExpenses}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            id="create-expense-btn"
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Expense Voucher</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Operating Outflow</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            PKR {totalExpenses.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
            {expenses.length} Vouchers logged
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Utility & Power Expenses</span>
          <div className="text-xl font-bold text-amber-700 mt-1">
            PKR{' '}
            {expenses
              .filter((e) => e.category === 'Utilities')
              .reduce((sum, e) => sum + Number(e.amount || 0), 0)
              .toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Electricity & Generator</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Supplies & Store Maintenance</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            PKR{' '}
            {expenses
              .filter((e) => e.category === 'Supplies' || e.category === 'Maintenance')
              .reduce((sum, e) => sum + Number(e.amount || 0), 0)
              .toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Packaging & AC services</span>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 pb-3 flex items-center space-x-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search description, voucher notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="All">All Categories</option>
          <option value="Utilities">Utilities</option>
          <option value="Supplies">Supplies</option>
          <option value="Rent">Rent</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Software">Software & Telecom</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Expense Description</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Voucher Notes</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading expenses from Google Sheets...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense records found. Click "+ Log Expense Voucher" to record one.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.expense_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-600">{exp.expense_date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{exp.description}</td>
                    <td className="py-3 px-4 text-slate-600">{exp.payment_method}</td>
                    <td className="py-3 px-4 text-slate-500 italic">{exp.notes || '-'}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700">
                      PKR {Number(exp.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(exp.expense_id, exp.description)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Log Pharmacy Operating Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Expense Date</label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Utilities">Utilities (IESCO / Gas)</option>
                    <option value="Supplies">Supplies & Packaging</option>
                    <option value="Rent">Shop Rent</option>
                    <option value="Maintenance">Maintenance & AC</option>
                    <option value="Software">Software & POS Hardware</option>
                    <option value="Other">Petty Cash & Misc</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Description / Title *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Generator Fuel Diesel 20 Litres"
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
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-rose-700"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Cash">Cash (Till)</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Receipt / Voucher Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Receipt # 8910 Attached"
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
                      <span>Recording to Sheets...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Expense Voucher</span>
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
