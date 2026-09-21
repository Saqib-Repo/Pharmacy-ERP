import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  CreditCard,
  FileText,
  Printer,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Supplier } from '../types';

interface SuppliersViewProps {
  onOpenSheetsModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToPurchases?: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  showToast,
  onNavigateToPurchases,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    supplier_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: 'Islamabad',
    ntn: '',
    strn: '',
    payment_terms: 'Net 30 Days',
    credit_limit: 500000,
    opening_balance: 0,
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statement modal state
  const [statementSupplier, setStatementSupplier] = useState<Supplier | null>(null);
  const [statementData, setStatementData] = useState<any | null>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  const openStatementModal = async (supp: Supplier) => {
    setStatementSupplier(supp);
    setLoadingStatement(true);
    try {
      const res = await fetch(`/api/suppliers/${supp.supplier_id}/statement`);
      const data = await res.json();
      setStatementData(data);
    } catch (err: any) {
      showToast('Error loading statement: ' + err.message, 'error');
    } finally {
      setLoadingStatement(false);
    }
  };

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast('Failed to load suppliers: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      supplier_name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      city: 'Islamabad',
      ntn: '',
      strn: '',
      payment_terms: 'Net 30 Days',
      credit_limit: 500000,
      opening_balance: 0,
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (supp: Supplier) => {
    setEditingSupplier(supp);
    setFormData({
      supplier_name: supp.supplier_name,
      contact_person: supp.contact_person || '',
      phone: supp.phone || '',
      email: supp.email || '',
      address: supp.address || '',
      city: supp.city || 'Islamabad',
      ntn: supp.ntn || '',
      strn: supp.strn || '',
      payment_terms: supp.payment_terms || 'Net 30 Days',
      credit_limit: Number(supp.credit_limit || 0),
      opening_balance: Number(supp.opening_balance || 0),
      status: supp.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_name.trim()) {
      showToast('Distributor name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.supplier_id}` : '/api/suppliers';
      const method = editingSupplier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || (!data.success && !data.supplier)) {
        throw new Error(data.error || 'Operation failed');
      }

      showToast(
        editingSupplier ? 'Distributor updated in Google Sheets!' : 'New Distributor added to Google Sheets!',
        'success'
      );
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate distributor: ${name}?`)) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Distributor removed from active list', 'info');
        loadSuppliers();
      }
    } catch (err: any) {
      showToast('Error removing distributor: ' + err.message, 'error');
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      s.supplier_name.toLowerCase().includes(q) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
      (s.city && s.city.toLowerCase().includes(q))
    );
  });

  const totalOutstanding = suppliers.reduce((sum, s) => sum + Number(s.opening_balance || 0), 0);

  return (
    <div id="suppliers-directory-view" className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">
              Pharmaceutical Distributors & Suppliers
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage distributor accounts, NTN tax registrations, credit limits, and drug supply terms.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadSuppliers}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            id="create-supplier-btn"
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Distributor</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Active Distributors</span>
          <div className="text-xl font-bold text-slate-900 mt-1">{suppliers.length}</div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
            Connected pharmaceutical suppliers
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Credit Exposure Limit</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            PKR{' '}
            {suppliers
              .reduce((sum, s) => sum + Number(s.credit_limit || 0), 0)
              .toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Cumulative approved lines</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Current Payable Balance</span>
          <div className="text-xl font-bold text-rose-700 mt-1">
            PKR {totalOutstanding.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">
            Payables tracked in Google Sheets
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 pb-3 flex items-center justify-between">
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search distributors by name, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Distributor Company</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Phone & City</th>
                <th className="py-3 px-4">NTN / STRN</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4 text-right">Payable Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading suppliers from Google Sheets...
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No distributors found. Click "+ Add New Distributor" to register one.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supp, idx) => (
                  <tr key={`${supp.supplier_id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{supp.supplier_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{supp.supplier_id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{supp.contact_person || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{supp.phone || 'No phone'}</div>
                      <div className="text-[10px] text-slate-400">{supp.city || 'Islamabad'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {supp.ntn || 'Exempt'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {supp.payment_terms || 'Net 30'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      PKR {Number(supp.opening_balance || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {supp.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openStatementModal(supp)}
                        className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Accounts Payable Statement"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => openEditModal(supp)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Distributor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(supp.supplier_id, supp.supplier_name)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Delete Distributor"
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

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingSupplier ? 'Edit Distributor Profile' : 'Register New Pharmaceutical Distributor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Company / Distributor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  placeholder="e.g. GlaxoSmithKline Pakistan Ltd"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    placeholder="e.g. Tariq Mahmood"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92-51-XXXXXXX"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="orders@distributor.com"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">NTN Number</label>
                  <input
                    type="text"
                    value={formData.ntn}
                    onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
                    placeholder="0819234-5"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Payment Terms</label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Net 15 Days">Net 15 Days</option>
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Net 60 Days">Net 60 Days</option>
                  </select>
                </div>
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
                  <label className="text-slate-700 font-bold block mb-1">Opening Payable (PKR)</label>
                  <input
                    type="number"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
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
                      <span>Saving to Sheets...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingSupplier ? 'Update Distributor' : 'Save Distributor'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier / Distributor Accounts Payable Ledger Statement Modal */}
      {statementSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">
                    Distributor Statement — {statementSupplier.supplier_name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    NTN: {statementSupplier.ntn || 'Unregistered'} • Terms: {statementSupplier.payment_terms || 'Net 30'} • Phone: {statementSupplier.phone || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setStatementSupplier(null);
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
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                  Compiling purchase invoices and payments from Google Sheets...
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
                      <div className="text-[10px] text-rose-700 uppercase font-semibold">Total Inward Stock</div>
                      <div className="text-sm font-bold text-rose-900 mt-1">
                        PKR {Number(statementData.totalPurchases || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="text-[10px] text-emerald-700 uppercase font-semibold">Total Disbursed</div>
                      <div className="text-sm font-bold text-emerald-900 mt-1">
                        PKR {Number(statementData.totalPaid || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="text-[10px] text-amber-700 uppercase font-semibold">Net Payable</div>
                      <div className="text-base font-extrabold text-amber-900 mt-1">
                        PKR {Number(statementData.currentBalance || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Ledger Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
                      <span>Inward Shipments & Payment Ledger</span>
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
                          <th className="py-2.5 px-3 text-right">Debit (Paid)</th>
                          <th className="py-2.5 px-3 text-right">Credit (Purchases)</th>
                          <th className="py-2.5 px-3 text-right">Balance Payable</th>
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
                            <td className="py-2 px-3 text-right text-emerald-700 font-semibold">
                              {entry.debit > 0 ? `PKR ${entry.debit.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right text-rose-700 font-semibold">
                              {entry.credit > 0 ? `PKR ${entry.credit.toLocaleString()}` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900">
                              PKR {Number(entry.balance || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  No ledger data available for this distributor.
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Credit Limit: PKR {Number(statementSupplier.credit_limit || 0).toLocaleString()}
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
                    setStatementSupplier(null);
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
