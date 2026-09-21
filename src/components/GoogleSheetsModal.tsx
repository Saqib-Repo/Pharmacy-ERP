import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  FileSpreadsheet,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { ConnectionStatus } from '../types';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ConnectionStatus | null;
  onRefreshStatus: () => Promise<void>;
  onInitSheets: () => Promise<void>;
  onSeedDemo: () => Promise<void>;
  isActionLoading: boolean;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefreshStatus,
  onInitSheets,
  onSeedDemo,
  isActionLoading,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'checklist' | 'guide'>('status');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isConnected = status?.connected ?? false;
  const isConfigured = status?.configured ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="sheets-connection-modal"
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Google Sheets Database Layer</h2>
              <p className="text-xs text-slate-400">
                Primary persistent backend for PharmaPulse ERP • Service Account Access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex space-x-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connection Status
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>18 Worksheet Verification</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {status?.sheets.length || 18}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Setup Guide (3 Steps)
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: STATUS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Primary Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
                  isConnected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {isConnected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="text-sm font-bold">
                    {isConnected
                      ? '✓ Google Sheets API Connected & Verified'
                      : 'Running in Local Diagnostic Preview Mode'}
                  </div>
                  <p className="text-xs mt-1 text-slate-700">
                    {isConnected
                      ? `Successfully authenticated with Google Cloud Service Account. Target spreadsheet: "${
                          status?.spreadsheetTitle || status?.spreadsheetId
                        }".`
                      : status?.errorMessage ||
                        'Service account credentials are not configured in environment variables. The ERP is operating with an in-memory sample store so all UI workflows, FEFO calculations, and dashboard metrics can be tested immediately.'}
                  </p>
                </div>
              </div>

              {/* Service Account & Spreadsheet Details */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Configured Parameters
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Service Account Email:</span>
                    <div className="flex items-center space-x-1.5">
                      <code className="font-mono bg-white px-2 py-0.5 rounded border text-slate-800">
                        {status?.serviceAccountEmail || 'pharmacy-system@my-project.iam.gserviceaccount.com'}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            status?.serviceAccountEmail || 'pharmacy-system@my-project.iam.gserviceaccount.com',
                            'email'
                          )
                        }
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Copy email to share spreadsheet"
                      >
                        {copiedKey === 'email' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Spreadsheet ID:</span>
                    <div className="flex items-center space-x-1.5">
                      <code className="font-mono bg-white px-2 py-0.5 rounded border text-slate-800 truncate max-w-xs">
                        {status?.spreadsheetId || 'Not configured in environment'}
                      </code>
                      {status?.spreadsheetId && status.spreadsheetId !== 'Not configured' && (
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${status.spreadsheetId}/edit`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-emerald-600 hover:text-emerald-700"
                          title="Open Google Spreadsheet"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500 font-medium">Worksheets Status:</span>
                    <span className="font-semibold text-slate-800">
                      {status?.missingSheetsCount === 0
                        ? 'All 18 worksheets recognized'
                        : `${status?.missingSheetsCount || 0} missing worksheets`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  id="sheets-refresh-status-btn"
                  onClick={onRefreshStatus}
                  disabled={isActionLoading}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isActionLoading ? 'animate-spin' : ''}`} />
                  <span>Test Connection</span>
                </button>

                <button
                  id="sheets-init-worksheets-btn"
                  onClick={onInitSheets}
                  disabled={isActionLoading}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Initialize 18 Worksheets & Headers</span>
                </button>

                <button
                  id="sheets-seed-demo-btn"
                  onClick={onSeedDemo}
                  disabled={isActionLoading}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Seed Pakistan Pharmacy Demo Data</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: WORKSHEET CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    ERP Database Worksheets (18 Schemas)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Each worksheet represents a dedicated entity table with strict column headers.
                  </p>
                </div>
                <button
                  onClick={onInitSheets}
                  disabled={isActionLoading}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  Create Missing Sheets
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {status?.sheets.map((sheet) => (
                  <div
                    key={sheet.name}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {sheet.exists ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-slate-900 font-mono flex items-center gap-2">
                          {sheet.name}
                          <span className="text-[10px] font-normal text-slate-600 font-sans">
                            ({sheet.expectedColumns.length} columns)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate max-w-lg">
                          Columns: {sheet.expectedColumns.slice(0, 7).join(', ')}...
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          sheet.exists
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sheet.exists ? `${sheet.rowCount} rows` : 'Missing in Sheet'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950">
                <div className="font-bold text-sm mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Production Google Service Account Connection
                </div>
                <p>
                  PharmaPulse ERP connects securely to Google Sheets using a Google Cloud Service
                  Account private key. The private key remains strictly on the Node.js server.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Create a Google Cloud Service Account</h4>
                    <p className="text-slate-600 mt-0.5">
                      In the Google Cloud Console, enable the <strong>Google Sheets API</strong>, create
                      a Service Account, and generate a JSON key.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Share your Google Spreadsheet</h4>
                    <p className="text-slate-600 mt-0.5">
                      Open your Google Spreadsheet, click <strong>Share</strong>, paste your Service
                      Account email (e.g.,{' '}
                      <code className="bg-slate-100 px-1 py-0.5 rounded">
                        pharmacy-system@my-project.iam.gserviceaccount.com
                      </code>
                      ), and give it <strong>Editor</strong> permission.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Add Environment Secrets</h4>
                    <p className="text-slate-600 mt-0.5">
                      Provide the variables via the AI Studio Settings / Secrets panel:
                    </p>
                    <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] space-y-1">
                      <div>GOOGLE_SERVICE_ACCOUNT_EMAIL="your-sa@project.iam.gserviceaccount.com"</div>
                      <div>GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n"</div>
                      <div>GOOGLE_SPREADSHEET_ID="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            PharmaPulse ERP • Phase 1 Core Infrastructure Active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
