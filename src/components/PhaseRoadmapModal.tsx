import React from 'react';
import { X, CheckCircle2, Clock, Sparkles, Layers } from 'lucide-react';

interface PhaseRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhaseRoadmapModal: React.FC<PhaseRoadmapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const phases = [
    {
      phase: 'Phase 1',
      title: 'Core Architecture & Infrastructure',
      status: 'Active / Completed',
      current: true,
      items: [
        'Project structure & Node.js Express + Vite full-stack server',
        'Professional commercial pharmacy ERP sidebar navigation (15 sections)',
        'Real-time Dashboard with Sales, Inventory, FEFO Expiry watch, Financial metrics',
        'Authentication architecture & Role-based Access Control (7 user roles)',
        'Google Sheets database service layer via Google Service Account (JWT)',
        '18 Worksheet schema definitions with exact columns & auto-initialization',
        'Environment configuration & diagnostic preview mode with Pakistan pharmacy data',
      ],
    },
    {
      phase: 'Phase 2',
      title: 'Products, Categories, Batches & Inventory',
      status: 'Next Phase (Ready for Prompt)',
      current: false,
      items: [
        'Full Product CRUD with Barcode, SKU, Generics, Strengths, Dosage forms',
        'Category Management and clinical classifications',
        'Multi-batch system with manufacturing date, expiry date, purchase/sale pricing',
        'FEFO inventory calculations, reorder thresholds & low-stock alerts',
      ],
    },
    {
      phase: 'Phase 3',
      title: 'Customers, Suppliers & Purchases',
      status: 'Scheduled',
      current: false,
      items: [
        'Customer profiles with credit limits, types (Walk-in, Regular), purchase history',
        'Supplier management with NTN, STRN, payment terms, opening balances',
        'Purchase invoice creation with batch allocation, payments, and supplier balance updates',
      ],
    },
    {
      phase: 'Phase 4',
      title: 'POS Counter, Sales, FEFO Dispensation & Invoicing',
      status: 'Scheduled',
      current: false,
      items: [
        'High-speed POS interface with USB barcode scanner detection',
        'FEFO automatic batch deduction (oldest valid expiry first, strictly no expired stock)',
        'Multi-batch split selling for single order items',
        'Pakistani payment channels: Cash, Card, Bank, JazzCash, Easypaisa',
        'Sale invoices, customer balance updates, transaction idempotency',
      ],
    },
    {
      phase: 'Phase 5',
      title: 'Sales Returns, Expenses, Reports & Ledgers',
      status: 'Scheduled',
      current: false,
      items: [
        'Invoice-linked sales returns with quantity caps and inventory reinstatement',
        'Expense tracking with categorization and employee attribution',
        'Comprehensive analytical reports (Daily/Weekly/Monthly Sales, Stock Valuation, Expiry)',
        'Customer and Supplier statements with transaction ledgers',
      ],
    },
    {
      phase: 'Phase 6',
      title: 'Users, Roles, Permissions & Audit Trails',
      status: 'Scheduled',
      current: false,
      items: [
        'Granular role-based permissions customization (Owner, Admin, Pharmacist, Cashier, etc.)',
        'Employee profiles with CNIC, designation, department, and salaries',
        'Immutable audit logs tracking module, action, record ID, and delta changes',
        'Company, tax, and inventory threshold settings',
      ],
    },
    {
      phase: 'Phase 7',
      title: 'FBR Integration Architecture, PDF Invoices & Optimization',
      status: 'Scheduled',
      current: false,
      items: [
        'Modular FBR POS integration architecture with status indicator and sandbox toggle',
        'A4 & thermal receipt printing templates with Pakistan NTN/STRN requirements',
        'Google Sheets batch read/write optimization and quota caching',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="roadmap-modal"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Phased Development Roadmap</h2>
              <p className="text-xs text-slate-400">Strict adherence to specification workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {phases.map((p) => (
            <div
              key={p.phase}
              className={`p-4 rounded-xl border transition-all ${
                p.current
                  ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`font-bold font-mono text-[11px] px-2 py-0.5 rounded ${
                      p.current
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {p.phase}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm">{p.title}</h3>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    p.current
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.current ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3" />}
                  {p.status}
                </span>
              </div>

              <ul className="space-y-1 text-slate-600 pl-2 mt-2">
                {p.items.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-slate-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
          >
            Close Roadmap
          </button>
        </div>
      </div>
    </div>
  );
};
