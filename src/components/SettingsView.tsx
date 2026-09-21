import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Database,
  FileText,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { Company, AuditLog } from '../types';

interface SettingsViewProps {
  onOpenSheetsModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenSheetsModal,
  showToast,
}) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoInitializing, setIsAutoInitializing] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    company_name: '',
    legal_name: '',
    pharmacy_name: '',
    owner_name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Islamabad',
    province: 'Islamabad Capital Territory',
    country: 'Pakistan',
    ntn: '',
    strn: '',
    currency: 'PKR',
    timezone: 'Asia/Karachi',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, logRes] = await Promise.all([
        fetch('/api/company').then((r) => r.json()),
        fetch('/api/audit-logs').then((r) => r.json()),
      ]);

      if (compRes) {
        setCompany(compRes);
        setFormData({
          company_name: compRes.company_name || '',
          legal_name: compRes.legal_name || '',
          pharmacy_name: compRes.pharmacy_name || '',
          owner_name: compRes.owner_name || '',
          phone: compRes.phone || '',
          email: compRes.email || '',
          address: compRes.address || '',
          city: compRes.city || 'Islamabad',
          province: compRes.province || 'Islamabad Capital Territory',
          country: compRes.country || 'Pakistan',
          ntn: compRes.ntn || '',
          strn: compRes.strn || '',
          currency: compRes.currency || 'PKR',
          timezone: compRes.timezone || 'Asia/Karachi',
        });
      }

      setAuditLogs(Array.isArray(logRes) ? logRes : []);
    } catch (err: any) {
      showToast('Error loading settings: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update company settings');
      }

      showToast('Pharmacy profile updated in Google Sheets!', 'success');
      loadData();
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoInit = async () => {
    setIsAutoInitializing(true);
    try {
      const res = await fetch('/api/auto-init', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        loadData();
      } else {
        showToast(data.error || 'Auto-initialization failed', 'error');
      }
    } catch (err: any) {
      showToast('Error initializing sheets: ' + err.message, 'error');
    } finally {
      setIsAutoInitializing(false);
    }
  };

  return (
    <div id="erp-settings-view" className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">ERP & Commercial Pharmacy Settings</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure business identity, drug licensing, tax details, and Google Sheets schema verification.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            id="open-google-sheets-modal-btn"
            onClick={onOpenSheetsModal}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center space-x-1.5 shadow-xs"
          >
            <Database className="w-4 h-4 text-emerald-700" />
            <span>Google Sheets Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Google Sheets Sync & Auto-Init Banner */}
        <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-sm font-bold">18-Module Production Google Sheets Sync</h2>
            </div>
            <p className="text-xs text-emerald-200 max-w-2xl">
              All transactions, inventory FEFO batches, customer credit accounts, sales invoices,
              and expenses are stored persistently in your connected Google Sheet.
            </p>
          </div>

          <button
            id="auto-init-all-sheets-btn"
            onClick={handleAutoInit}
            disabled={isAutoInitializing}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors shrink-0"
          >
            {isAutoInitializing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying 18 Worksheets...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Auto-Verify & Populate Sheets</span>
              </>
            )}
          </button>
        </div>

        {/* Pharmacy Commercial Profile Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span>Pharmacy Legal Profile & Licensing (Thermal Receipt Header)</span>
          </h2>

          <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Trade / Pharmacy Name *</label>
                <input
                  type="text"
                  required
                  value={formData.pharmacy_name}
                  onChange={(e) => setFormData({ ...formData, pharmacy_name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Legal Registered Entity *</label>
                <input
                  type="text"
                  required
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Licensee / Owner Name</label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Official Telephone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Official Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">NTN Number</label>
                <input
                  type="text"
                  value={formData.ntn}
                  onChange={(e) => setFormData({ ...formData, ntn: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">STRN / Sales Tax #</label>
                <input
                  type="text"
                  value={formData.strn}
                  onChange={(e) => setFormData({ ...formData, strn: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-slate-700 font-bold block mb-1">Pharmacy Physical Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">City & Country</label>
                <input
                  type="text"
                  value={`${formData.city}, ${formData.country}`}
                  readOnly
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-200">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Pharmacy Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Audit Trail Log */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                System Security & Activity Audit Trail
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Permanent immutable log of product edits, sales, returns, and stock deductions.
              </p>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">
              {auditLogs.length} Recent entries
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Module</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{log.user_id}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-700">{log.module}</td>
                      <td className="py-2.5 px-4 text-slate-600 text-[11px] truncate max-w-xs">
                        {log.new_value || log.record_id}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
