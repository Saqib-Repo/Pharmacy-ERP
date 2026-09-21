import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  UserCheck,
  Edit2,
  Trash2,
  CreditCard,
  FileText,
  Printer,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Customer } from '../types';

interface CustomersViewProps {
  onOpenSheetsModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  showToast,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    customer_code: '',
    customer_name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Islamabad',
    customer_type: 'Regular' as 'Walk-in' | 'Regular' | 'Corporate',
    opening_balance: 0,
    credit_limit: 15000,
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statement modal state
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);
  const [statementData, setStatementData] = useState<any | null>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  const openStatementModal = async (c: Customer) => {
    setStatementCustomer(c);
    setLoadingStatement(true);
    try {
      const res = await fetch(`/api/customers/${c.customer_id}/statement`);
      const data = await res.json();
      setStatementData(data);
    } catch (err: any) {
      showToast('Error loading statement: ' + err.message, 'error');
    } finally {
      setLoadingStatement(false);
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast('Error loading customers: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      customer_code: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: '',
      phone: '',
      email: '',
      address: '',
      city: 'Islamabad',
      customer_type: 'Regular',
      opening_balance: 0,
      credit_limit: 15000,
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      customer_code: c.customer_code || '',
      customer_name: c.customer_name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || 'Islamabad',
      customer_type: c.customer_type || 'Regular',
      opening_balance: Number(c.opening_balance || 0),
      credit_limit: Number(c.credit_limit || 0),
      status: c.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name.trim()) {
      showToast('Patient name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.customer_id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || (!data.success && !data.customer)) {
        throw new Error(data.error || 'Failed to save customer');
      }

      showToast(
        editingCustomer ? 'Patient profile updated in Google Sheets!' : 'New Patient saved to Google Sheets!',
        'success'
      );
      setIsModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate patient: ${name}?`)) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Patient marked as inactive', 'info');
        loadCustomers();
      }
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.customer_name.toLowerCase().includes(q) ||
      (c.customer_code && c.customer_code.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q));

    const matchesType = typeFilter === 'All' || c.customer_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalReceivable = customers.reduce((sum, c) => sum + Number(c.opening_balance || 0), 0);

  return (
    <div id="customers-khata-view" className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Patients & Customer Khata Directory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage pharmacy patient accounts, credit lines (Khata), prescriptions, and ledger balances.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadCustomers}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            id="create-customer-btn"
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Patient / Customer</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Registered Patients</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{customers.length}</div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
            Chronic & regular accounts
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Active Khata Receivables</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            PKR {totalReceivable.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Outstanding patient credit</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Corporate Accounts</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {customers.filter((c) => c.customer_type === 'Corporate').length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Clinics & Insurance billings</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="px-6 pb-3 flex items-center space-x-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, phone, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="All">All Customer Types</option>
          <option value="Regular">Regular Patient</option>
          <option value="Walk-in">Walk-in</option>
          <option value="Corporate">Corporate / Clinic</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Patient Code</th>
                <th className="py-3 px-4">Patient / Customer Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">City / Area</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Khata Balance</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading patients from Google Sheets...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No patients found. Click "+ Add New Patient" to register one.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, idx) => (
                  <tr key={`${c.customer_id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      {c.customer_code || c.customer_id}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.customer_name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.phone || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600">{c.city || 'Islamabad'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {c.customer_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      PKR {Number(c.opening_balance || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">
                      PKR {Number(c.credit_limit || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openStatementModal(c)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Khata Ledger Statement"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Patient"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.customer_id, c.customer_name)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Delete Patient"
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

      {/* Add / Edit Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingCustomer ? 'Edit Patient Profile' : 'Register New Patient / Khata Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Patient Code</label>
                  <input
                    type="text"
                    value={formData.customer_code}
                    onChange={(e) => setFormData({ ...formData, customer_code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Customer Type</label>
                  <select
                    value={formData.customer_type}
                    onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Regular">Regular Patient</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Corporate">Corporate Account</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="e.g. Dr. Salman Qureshi"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Mobile / WhatsApp Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92-300-XXXXXXX"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="patient@email.com"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Residential Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street / Sector"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Credit Limit (PKR)</label>
                  <input
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Current Khata Balance (PKR)</label>
                  <input
                    type="number"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-emerald-800"
                  />
                </div>
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
                      <span>Saving Patient...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingCustomer ? 'Update Patient' : 'Save Patient'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Khata Ledger Statement Modal */}
      {statementCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    Khata Statement — {statementCustomer.customer_name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Code: {statementCustomer.customer_code || statementCustomer.customer_id} • Phone: {statementCustomer.phone || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStatementCustomer(null);
                  setStatementData(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {loadingStatement ? (
                <div className="py-16 text-center text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  Generating chronological Khata ledger from Google Sheets...
                </div>
              ) : statementData ? (
                <>
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Opening Balance</div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        PKR {Number(statementData.openingBalance || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                      <div className="text-[10px] text-rose-700 uppercase font-semibold">Total Invoiced</div>
                      <div className="text-sm font-bold text-rose-900 mt-1">
                        PKR {Number(statementData.totalInvoiced || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="text-[10px] text-emerald-700 uppercase font-semibold">Total Paid</div>
                      <div className="text-sm font-bold text-emerald-900 mt-1">
                        PKR {Number(statementData.totalPaid || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="text-[10px] text-blue-700 uppercase font-semibold">Net Balance Due</div>
                      <div className="text-base font-extrabold text-blue-900 mt-1">
                        PKR {Number(statementData.currentBalance || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
                      <span>Transaction Ledger History</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        {statementData.ledger?.length || 0} Records
                      </span>
                    </div>

                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Reference #</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-right">Debit (PKR)</th>
                          <th className="py-2.5 px-3 text-right">Credit (PKR)</th>
                          <th className="py-2.5 px-3 text-right">Balance (PKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {statementData.ledger?.map((entry: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2 px-3 text-slate-600 whitespace-nowrap">
                              {entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-2 px-3 font-mono font-semibold text-slate-700">
                              {entry.reference}
                            </td>
                            <td className="py-2 px-3 text-slate-800">{entry.description}</td>
                            <td className="py-2 px-3 text-right text-rose-700 font-semibold">
                              {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-700 font-semibold">
                              {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              {Number(entry.balance || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  No statement data available for this customer.
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Credit Limit: PKR {Number(statementCustomer.credit_limit || 0).toLocaleString()}
              </span>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center space-x-1 text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatementCustomer(null);
                    setStatementData(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
