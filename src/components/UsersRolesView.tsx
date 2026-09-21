import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Key,
  Check,
  X as CloseIcon,
  Shield,
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Mail,
  Phone,
  AlertCircle,
  Save,
} from 'lucide-react';
import { User, UserRole, Role } from '../types';

interface UsersRolesViewProps {
  currentUser: User | null;
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  availableRoles: { role_name: UserRole; description: string }[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface UserAccount {
  user_id: string;
  employee_id?: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  last_login?: string;
  created_at?: string;
}

const DEFAULT_MODULES = [
  'Dashboard & Financial Analytics',
  'POS Counter & Billing',
  'Process Sales Returns & Refunds',
  'Manage Drug Master & Categories',
  'FEFO Stock Adjustments & Write-Offs',
  'Receive Inward Purchases & Batches',
  'Manage Suppliers & Khata Limits',
  'Log Store Expenses & Vouchers',
  'Staff Payroll & ERP Settings',
];

const INITIAL_MATRIX: Record<UserRole, Record<string, boolean>> = {
  Owner: {
    'Dashboard & Financial Analytics': true,
    'POS Counter & Billing': true,
    'Process Sales Returns & Refunds': true,
    'Manage Drug Master & Categories': true,
    'FEFO Stock Adjustments & Write-Offs': true,
    'Receive Inward Purchases & Batches': true,
    'Manage Suppliers & Khata Limits': true,
    'Log Store Expenses & Vouchers': true,
    'Staff Payroll & ERP Settings': true,
  },
  Administrator: {
    'Dashboard & Financial Analytics': true,
    'POS Counter & Billing': true,
    'Process Sales Returns & Refunds': true,
    'Manage Drug Master & Categories': true,
    'FEFO Stock Adjustments & Write-Offs': true,
    'Receive Inward Purchases & Batches': true,
    'Manage Suppliers & Khata Limits': true,
    'Log Store Expenses & Vouchers': true,
    'Staff Payroll & ERP Settings': true,
  },
  Manager: {
    'Dashboard & Financial Analytics': true,
    'POS Counter & Billing': true,
    'Process Sales Returns & Refunds': true,
    'Manage Drug Master & Categories': true,
    'FEFO Stock Adjustments & Write-Offs': true,
    'Receive Inward Purchases & Batches': true,
    'Manage Suppliers & Khata Limits': true,
    'Log Store Expenses & Vouchers': true,
    'Staff Payroll & ERP Settings': false,
  },
  Pharmacist: {
    'Dashboard & Financial Analytics': true,
    'POS Counter & Billing': true,
    'Process Sales Returns & Refunds': true,
    'Manage Drug Master & Categories': true,
    'FEFO Stock Adjustments & Write-Offs': true,
    'Receive Inward Purchases & Batches': false,
    'Manage Suppliers & Khata Limits': false,
    'Log Store Expenses & Vouchers': false,
    'Staff Payroll & ERP Settings': false,
  },
  Cashier: {
    'Dashboard & Financial Analytics': false,
    'POS Counter & Billing': true,
    'Process Sales Returns & Refunds': false,
    'Manage Drug Master & Categories': false,
    'FEFO Stock Adjustments & Write-Offs': false,
    'Receive Inward Purchases & Batches': false,
    'Manage Suppliers & Khata Limits': false,
    'Log Store Expenses & Vouchers': false,
    'Staff Payroll & ERP Settings': false,
  },
  'Inventory Manager': {
    'Dashboard & Financial Analytics': false,
    'POS Counter & Billing': false,
    'Process Sales Returns & Refunds': false,
    'Manage Drug Master & Categories': true,
    'FEFO Stock Adjustments & Write-Offs': true,
    'Receive Inward Purchases & Batches': true,
    'Manage Suppliers & Khata Limits': false,
    'Log Store Expenses & Vouchers': false,
    'Staff Payroll & ERP Settings': false,
  },
  Accountant: {
    'Dashboard & Financial Analytics': true,
    'POS Counter & Billing': false,
    'Process Sales Returns & Refunds': false,
    'Manage Drug Master & Categories': false,
    'FEFO Stock Adjustments & Write-Offs': false,
    'Receive Inward Purchases & Batches': false,
    'Manage Suppliers & Khata Limits': true,
    'Log Store Expenses & Vouchers': true,
    'Staff Payroll & ERP Settings': false,
  },
};

export const UsersRolesView: React.FC<UsersRolesViewProps> = ({
  currentUser,
  currentRole,
  onSwitchRole,
  availableRoles,
  showToast,
}) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'permissions'>('users');

  // Permissions state
  const [permissionsState, setPermissionsState] = useState<Record<UserRole, Record<string, boolean>>>(INITIAL_MATRIX);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  // User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Cashier' as UserRole,
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast('Error loading user accounts: ' + err.message, 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Cashier',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showToast('Name and Email are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingUser ? `/api/users/${editingUser.user_id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save user account');

      showToast(
        editingUser ? 'User updated in Google Sheets!' : 'New user account added to Google Sheets!',
        'success'
      );
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate login credentials for ${name}?`)) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to deactivate user');
      showToast(`User ${name} deactivated.`, 'info');
      fetchUsers();
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const togglePermission = (role: UserRole, mod: string) => {
    if (role === 'Owner') {
      showToast('Owner permissions are permanently granted for all modules.', 'info');
      return;
    }
    setPermissionsState((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [mod]: !prev[role]?.[mod],
      },
    }));
  };

  const savePermissionsToSheet = async () => {
    setIsSavingPerms(true);
    try {
      // Update each role in backend
      for (const roleObj of availableRoles) {
        const roleName = roleObj.role_name;
        const grantedMods = Object.entries(permissionsState[roleName] || {})
          .filter(([_, allowed]) => allowed)
          .map(([mod]) => mod);

        await fetch(`/api/roles/${roleName}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permissions: grantedMods }),
        });
      }
      showToast('RBAC Role Permissions updated in Google Sheets Roles tab!', 'success');
    } catch (err: any) {
      showToast('Error saving permissions: ' + err.message, 'error');
    } finally {
      setIsSavingPerms(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  return (
    <div id="users-roles-view" className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">
              User Accounts & Role-Based Access Control (RBAC)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage pharmacy staff credentials, user login access, and granular permission boundaries.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Currently Active As:</span>
            <span className="px-2.5 py-0.5 bg-emerald-700 text-white text-xs font-bold rounded-md">
              {currentRole}
            </span>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff User</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Switch Active Role Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Emulate Role Access (Test Permissions & View Limits)
              </h2>
              <p className="text-xs text-slate-500">
                Click any role to immediately test real-time ERP access constraints across all 18 worksheets.
              </p>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Active: {currentRole}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
            {availableRoles.map((r) => {
              const isCurrent = currentRole === r.role_name;
              return (
                <button
                  key={r.role_name}
                  onClick={() => onSwitchRole(r.role_name)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isCurrent
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900">{r.role_name}</span>
                    {isCurrent && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{r.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'users'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff User Accounts ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'permissions'
                ? 'border-emerald-600 text-emerald-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Role Permissions Matrix & Customizer</span>
          </button>
        </div>

        {/* TAB 1: User Accounts Table */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user name, email, role..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchUsers}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                  title="Refresh users"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                </button>
                <span className="text-xs text-slate-500">
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} loaded from Google Sheets
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Contact Details</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                        Loading staff users from Google Sheets...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No staff users found matching "{searchQuery}".
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{user.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{user.user_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col space-y-0.5">
                            <span className="flex items-center text-slate-600">
                              <Mail className="w-3 h-3 mr-1 text-slate-400" />
                              {user.email}
                            </span>
                            {user.phone && (
                              <span className="flex items-center text-slate-500 text-[11px]">
                                <Phone className="w-3 h-3 mr-1 text-slate-400" />
                                {user.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-semibold rounded-md text-[11px] border border-slate-200">
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              user.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Initial'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Edit user"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.user_id, user.name)}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                              title="Deactivate account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Permission Boundary Matrix */}
        {activeTab === 'permissions' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pharmaceutical Security & Audit Permission Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any checkbox to grant or revoke specific ERP operations. Changes persist directly into Google Sheets.
                </p>
              </div>

              <button
                onClick={savePermissionsToSheet}
                disabled={isSavingPerms}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors self-start sm:self-auto"
              >
                {isSavingPerms ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Permissions Matrix</span>
                  </>
                )}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">ERP Module / Operation</th>
                    <th className="py-3 px-3 text-center">Owner</th>
                    <th className="py-3 px-3 text-center">Pharmacist</th>
                    <th className="py-3 px-3 text-center">Cashier</th>
                    <th className="py-3 px-3 text-center">Inventory Mgr</th>
                    <th className="py-3 px-3 text-center">Accountant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DEFAULT_MODULES.map((mod, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800">{mod}</td>

                      {/* Owner Column (Immutable full access) */}
                      <td className="py-3 px-3 text-center bg-slate-50/50">
                        <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                      </td>

                      {/* Pharmacist */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => togglePermission('Pharmacist', mod)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            permissionsState.Pharmacist?.[mod]
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-slate-500'
                          }`}
                        >
                          {permissionsState.Pharmacist?.[mod] ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <CloseIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      {/* Cashier */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => togglePermission('Cashier', mod)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            permissionsState.Cashier?.[mod]
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-slate-500'
                          }`}
                        >
                          {permissionsState.Cashier?.[mod] ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <CloseIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      {/* Inventory Manager */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => togglePermission('Inventory Manager', mod)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            permissionsState['Inventory Manager']?.[mod]
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-slate-500'
                          }`}
                        >
                          {permissionsState['Inventory Manager']?.[mod] ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <CloseIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>

                      {/* Accountant */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => togglePermission('Accountant', mod)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            permissionsState.Accountant?.[mod]
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'bg-slate-50 border-slate-200 text-slate-300 hover:text-slate-500'
                          }`}
                        >
                          {permissionsState.Accountant?.[mod] ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <CloseIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                Active Owner account always retains root override across all pharmaceutical records.
              </span>
              <span className="text-[11px] font-mono">Worksheet: Roles</span>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingUser ? 'Edit Staff User Account' : 'Create Staff User Account'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Staff Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Asim Qureshi"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Email / Login *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@pharmacy.pk"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Phone (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0300-1234567"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Inventory Manager">Inventory Manager</option>
                    <option value="Accountant">Accountant</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center space-x-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving in Sheets...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingUser ? 'Update Account' : 'Create Account'}</span>
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
