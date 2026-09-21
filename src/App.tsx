import React, { useState, useEffect } from 'react';
import { Sidebar, NavItemKey } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { Dashboard } from './components/Dashboard';
import { POSView } from './components/POSView';
import { SalesView } from './components/SalesView';
import { PurchasesView } from './components/PurchasesView';
import { InventoryView } from './components/InventoryView';
import { ProductsView } from './components/ProductsView';
import { CategoriesView } from './components/CategoriesView';
import { CustomersView } from './components/CustomersView';
import { SuppliersView } from './components/SuppliersView';
import { EmployeesView } from './components/EmployeesView';
import { ExpensesView } from './components/ExpensesView';
import { PaymentsView } from './components/PaymentsView';
import { ReportsView } from './components/ReportsView';
import { UsersRolesView } from './components/UsersRolesView';
import { SettingsView } from './components/SettingsView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { PhaseRoadmapModal } from './components/PhaseRoadmapModal';
import { User, UserRole, ConnectionStatus, DashboardMetrics } from './types';

export default function App() {
  const [currentNav, setCurrentNav] = useState<NavItemKey>('Dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('Owner');
  const [availableRoles, setAvailableRoles] = useState<{ role_name: UserRole; description: string }[]>([]);
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Fetch initial system status, auth, and dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [statusRes, authRes, dashRes] = await Promise.all([
        fetch('/api/status').then((r) => r.json()),
        fetch('/api/auth/me').then((r) => r.json()),
        fetch('/api/dashboard').then((r) => r.json()),
      ]);

      setStatus(statusRes);
      if (authRes.user) {
        setCurrentUser(authRes.user);
        setCurrentRole(authRes.user.role);
      }
      if (authRes.availableRoles) {
        setAvailableRoles(authRes.availableRoles);
      }
      setMetrics(dashRes);
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
      showToast('Failed to connect to backend server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSwitchRole = async (newRole: UserRole) => {
    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentRole(newRole);
        if (currentUser) {
          setCurrentUser({ ...currentUser, role: newRole });
        }
        showToast(`Switched active view role to: ${newRole}`, 'info');
      }
    } catch (err: any) {
      showToast('Error switching role', 'error');
    }
  };

  const handleInitSheets = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/init-sheets', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        // Refresh status
        const updatedStatus = await fetch('/api/status').then((r) => r.json());
        setStatus(updatedStatus);
      } else {
        showToast(data.error || 'Failed to initialize sheets', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error communicating with Google Sheets', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/seed-demo', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        // Refresh status and dashboard
        const [updatedStatus, updatedDash] = await Promise.all([
          fetch('/api/status').then((r) => r.json()),
          fetch('/api/dashboard').then((r) => r.json()),
        ]);
        setStatus(updatedStatus);
        setMetrics(updatedDash);
      } else {
        showToast(data.error || 'Failed to seed demo data', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error seeding demo data', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const expiryAlertCount = (metrics?.expiry.expiredCount || 0) + (metrics?.expiry.expiring30Days || 0);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
      {/* Toast Notification */}
      {toast && (
        <div
          id="system-toast-notification"
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center space-x-2 transition-all animate-in fade-in duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Sidebar */}
      <Sidebar
        currentNav={currentNav}
        onSelectNav={setCurrentNav}
        userRole={currentRole}
        isSheetsConnected={status?.connected || false}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        expiryAlertCount={expiryAlertCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopNav
          currentUser={currentUser}
          currentRole={currentRole}
          onSwitchRole={handleSwitchRole}
          availableRoles={availableRoles}
          isSheetsConnected={status?.connected || false}
          onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
          onOpenRoadmapModal={() => setIsRoadmapModalOpen(true)}
          pharmacyName="Shaheen Medicos & Pharmacy (Pvt) Ltd"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {currentNav === 'Dashboard' && (
            <Dashboard
              metrics={metrics}
              loading={loading}
              onRefresh={fetchData}
              onNavigate={setCurrentNav}
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
            />
          )}

          {currentNav === 'POS' && (
            <POSView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              onNavigateToSales={() => setCurrentNav('Sales')}
              showToast={showToast}
            />
          )}

          {currentNav === 'Sales' && (
            <SalesView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              onNavigateToPOS={() => setCurrentNav('POS')}
              showToast={showToast}
            />
          )}

          {currentNav === 'Purchases' && (
            <PurchasesView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              onNavigateToInventory={() => setCurrentNav('Inventory')}
              showToast={showToast}
            />
          )}

          {currentNav === 'Inventory' && (
            <InventoryView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              showToast={showToast}
            />
          )}

          {currentNav === 'Products' && (
            <ProductsView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              onNavigateToInventory={() => setCurrentNav('Inventory')}
              showToast={showToast}
            />
          )}

          {currentNav === 'Categories' && (
            <CategoriesView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              onNavigateToProductsWithCategory={() => {
                setCurrentNav('Products');
              }}
              showToast={showToast}
            />
          )}

          {currentNav === 'Customers' && (
            <CustomersView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              showToast={showToast}
            />
          )}

          {currentNav === 'Suppliers' && (
            <SuppliersView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              onNavigateToPurchases={() => setCurrentNav('Purchases')}
              showToast={showToast}
            />
          )}

          {currentNav === 'Employees' && (
            <EmployeesView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              showToast={showToast}
            />
          )}

          {currentNav === 'Expenses' && (
            <ExpensesView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              showToast={showToast}
            />
          )}

          {currentNav === 'Payments' && (
            <PaymentsView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              showToast={showToast}
            />
          )}

          {currentNav === 'Reports' && (
            <ReportsView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              showToast={showToast}
            />
          )}

          {currentNav === 'Users & Roles' && (
            <UsersRolesView
              currentUser={currentUser}
              currentRole={currentRole}
              onSwitchRole={handleSwitchRole}
              availableRoles={availableRoles}
              showToast={showToast}
            />
          )}

          {currentNav === 'Settings' && (
            <SettingsView
              onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Google Sheets Diagnostics & Setup Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        status={status}
        onRefreshStatus={async () => {
          setActionLoading(true);
          try {
            const res = await fetch('/api/status').then((r) => r.json());
            setStatus(res);
            showToast('Google Sheets connection status refreshed', 'info');
          } catch (e: any) {
            showToast('Failed to refresh status', 'error');
          } finally {
            setActionLoading(false);
          }
        }}
        onInitSheets={handleInitSheets}
        onSeedDemo={handleSeedDemo}
        isActionLoading={actionLoading}
      />

      {/* Phased Roadmap Modal */}
      <PhaseRoadmapModal
        isOpen={isRoadmapModalOpen}
        onClose={() => setIsRoadmapModalOpen(false)}
      />
    </div>
  );
}
