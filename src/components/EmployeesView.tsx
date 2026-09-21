import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  Shield,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  X,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Employee } from '../types';

interface EmployeesViewProps {
  onOpenSheetsModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  showToast,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    employee_code: '',
    name: '',
    cnic: '',
    phone: '',
    email: '',
    designation: 'Pharmacist',
    department: 'Pharmacy',
    joining_date: new Date().toISOString().split('T')[0],
    salary: 60000,
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast('Error loading staff: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const openCreateModal = () => {
    setEditingEmployee(null);
    setFormData({
      employee_code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      cnic: '',
      phone: '',
      email: '',
      designation: 'Pharmacist',
      department: 'Pharmacy',
      joining_date: new Date().toISOString().split('T')[0],
      salary: 60000,
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      employee_code: emp.employee_code || '',
      name: emp.name,
      cnic: emp.cnic || '',
      phone: emp.phone || '',
      email: emp.email || '',
      designation: emp.designation || 'Pharmacist',
      department: emp.department || 'Pharmacy',
      joining_date: emp.joining_date || '',
      salary: Number(emp.salary || 0),
      status: emp.status || 'Active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Staff name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee.employee_id}` : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || (!data.success && !data.employee)) {
        throw new Error(data.error || 'Failed to save staff');
      }

      showToast(
        editingEmployee ? 'Staff profile updated in Google Sheets!' : 'New Staff added to Google Sheets!',
        'success'
      );
      setIsModalOpen(false);
      loadEmployees();
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate staff record: ${name}?`)) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Staff record deactivated', 'info');
        loadEmployees();
      }
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      emp.name.toLowerCase().includes(q) ||
      (emp.designation && emp.designation.toLowerCase().includes(q)) ||
      (emp.employee_code && emp.employee_code.toLowerCase().includes(q));

    const matchesDept = deptFilter === 'All' || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const totalMonthlyPayroll = employees
    .filter((e) => e.status === 'Active')
    .reduce((sum, e) => sum + Number(e.salary || 0), 0);

  return (
    <div id="employees-management-view" className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Pharmacy Staff & Employee Directory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Licensed Pharmacists, Counter Cashiers, Store Keepers, and Staff Payroll tracking.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadEmployees}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            id="create-employee-btn"
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Employee</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Active Pharmacy Staff</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {employees.filter((e) => e.status === 'Active').length}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
            Across Clinical & Retail shifts
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Monthly Payroll Commitment</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            PKR {totalMonthlyPayroll.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Base salaries total</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Licensed Pharmacists</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            {employees.filter((e) => e.designation?.toLowerCase().includes('pharmacist')).length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Registered drug dispensers</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 pb-3 flex items-center space-x-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by staff name, designation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="All">All Departments</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Accounts">Accounts</option>
          <option value="Warehouse">Warehouse</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Code & Name</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">CNIC / ID</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-right">Monthly Salary</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading staff directory from Google Sheets...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No staff records found. Click "+ Add New Employee" to register staff.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {emp.employee_code || emp.employee_id}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{emp.designation}</td>
                    <td className="py-3 px-4 text-slate-600">{emp.department}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{emp.cnic || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600">{emp.phone || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      PKR {Number(emp.salary || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {emp.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Staff"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.employee_id, emp.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Deactivate Staff"
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

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingEmployee ? 'Edit Staff Profile' : 'Register New Pharmacy Employee'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Asim Raza"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Designation</label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Chief Pharmacist">Chief Pharmacist</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Assistant Pharmacist">Assistant Pharmacist</option>
                    <option value="Cashier">Counter Cashier</option>
                    <option value="Store Keeper">Store Keeper</option>
                    <option value="Accountant">Accountant</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">CNIC Number</label>
                  <input
                    type="text"
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                    placeholder="61101-XXXXXXX-X"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+92-300-XXXXXXX"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Monthly Salary (PKR)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
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
                      <span>Saving Staff...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingEmployee ? 'Update Staff' : 'Save Staff'}</span>
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
