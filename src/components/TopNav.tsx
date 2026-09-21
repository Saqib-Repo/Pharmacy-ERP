import React from 'react';
import {
  Search,
  Bell,
  Database,
  Building2,
  ChevronDown,
  Shield,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { User, UserRole } from '../types';

interface TopNavProps {
  currentUser: User | null;
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  availableRoles: { role_name: UserRole; description: string }[];
  isSheetsConnected: boolean;
  onOpenSheetsModal: () => void;
  onOpenRoadmapModal: () => void;
  pharmacyName?: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentUser,
  currentRole,
  onSwitchRole,
  availableRoles,
  isSheetsConnected,
  onOpenSheetsModal,
  onOpenRoadmapModal,
  pharmacyName = 'Shaheen Medicos & Pharmacy',
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header
      id="pharmapulse-topnav"
      className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shrink-0"
    >
      {/* Left: Pharmacy Brand / Location Info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-slate-800">
          <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">
              {pharmacyName}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              NTN: 7482910-3 • STRN: 1700748291013 • Currency: PKR (₨)
            </p>
          </div>
        </div>
      </div>

      {/* Center: Global Quick Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search medicines, barcode, batch, customer, or invoice..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-lg outline-none transition-all placeholder:text-slate-400 text-slate-800 font-medium"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded border border-slate-300/60">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Status Pill, Phase Roadmap, Role Switcher & User Profile */}
      <div className="flex items-center space-x-3">
        {/* Phase Plan Button */}
        <button
          id="topnav-roadmap-btn"
          onClick={onOpenRoadmapModal}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
          title="View Phased Architecture Roadmap"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Phase 1 Active</span>
        </button>

        {/* Google Sheets Connection Pill */}
        <button
          id="topnav-sheets-status-btn"
          onClick={onOpenSheetsModal}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            isSheetsConnected
              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isSheetsConnected ? 'Google Sheets Live' : 'Sheets: Preview Mode'}</span>
        </button>

        {/* Role Switcher */}
        <div className="relative group">
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer transition-colors">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Role: {currentRole}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>

          <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 hidden group-hover:block z-50">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
              Switch Test Role
            </div>
            {availableRoles.map((role) => (
              <button
                key={role.role_name}
                id={`switch-role-${role.role_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => onSwitchRole(role.role_name)}
                className={`w-full text-left px-3 py-1.5 text-xs flex flex-col transition-colors ${
                  currentRole === role.role_name
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{role.role_name}</span>
                <span className="text-[10px] text-slate-500 font-normal leading-tight">
                  {role.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Current User */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
            {currentUser?.name
              ? currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
              : 'TM'}
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-bold text-slate-800 leading-tight">
              {currentUser?.name || 'Dr. Tariq Khan'}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {currentUser?.role || 'Owner'} • ID: EMP-001
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
