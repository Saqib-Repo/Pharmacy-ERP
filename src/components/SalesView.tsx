import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  RotateCcw,
  Printer,
  Calendar,
  DollarSign,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ArrowDownLeft,
} from 'lucide-react';
import { Sale, Customer, Product } from '../types';

interface SalesViewProps {
  onOpenSheetsModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToPOS?: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  showToast,
  onNavigateToPOS,
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Selected Sale Details Drawer
  const [selectedSaleDetails, setSelectedSaleDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnItems, setReturnItems] = useState<{ product_id: string; batch_id: string; maxQty: number; returnQty: number; sale_price: number }[]>([]);
  const [returnReason, setReturnReason] = useState('Patient Return / Change of Prescription');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  const loadSalesData = async () => {
    setLoading(true);
    try {
      const [salesRes, custRes, prodRes] = await Promise.all([
        fetch('/api/sales').then((r) => r.json()),
        fetch('/api/customers').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
      ]);

      setSales(Array.isArray(salesRes) ? salesRes : []);
      setCustomers(Array.isArray(custRes) ? custRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
    } catch (err: any) {
      showToast('Failed to load sales: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSalesData();
  }, []);

  const openSaleDetails = async (saleId: string) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      const data = await res.json();
      setSelectedSaleDetails(data);
    } catch (err: any) {
      showToast('Error loading invoice details: ' + err.message, 'error');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleOpenReturnModal = () => {
    if (!selectedSaleDetails || !selectedSaleDetails.items) return;
    setReturnItems(
      selectedSaleDetails.items.map((item: any) => ({
        product_id: item.product_id,
        batch_id: item.batch_id,
        maxQty: Number(item.quantity),
        returnQty: 0,
        sale_price: Number(item.sale_price),
      }))
    );
    setIsReturnModalOpen(true);
  };

  const handleProcessReturn = async () => {
    const itemsToReturn = returnItems.filter((i) => i.returnQty > 0);
    if (itemsToReturn.length === 0) {
      showToast('Please select quantity to return for at least one item', 'error');
      return;
    }

    setIsProcessingReturn(true);
    try {
      const refundTotal = itemsToReturn.reduce((sum, i) => sum + i.returnQty * i.sale_price, 0);
      const payload = {
        sale_id: selectedSaleDetails.sale.sale_id,
        items: itemsToReturn.map((i) => ({
          product_id: i.product_id,
          batch_id: i.batch_id,
          quantity: i.returnQty,
          sale_price: i.sale_price,
        })),
        reason: returnReason,
        refund_amount: refundTotal,
      };

      const res = await fetch('/api/sales/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process return');
      }

      showToast(`Return processed! Voucher: ${data.return_number}`, 'success');
      setIsReturnModalOpen(false);
      setSelectedSaleDetails(null);
      loadSalesData();
    } catch (err: any) {
      showToast('Return Error: ' + err.message, 'error');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  // Filter sales
  const filteredSales = sales.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customer_id && s.customer_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPayment = paymentFilter === 'All' || s.payment_method === paymentFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

    return matchesSearch && matchesPayment && matchesStatus;
  });

  const totalSalesRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const completedCount = sales.filter((s) => s.status === 'Completed').length;
  const returnedCount = sales.filter((s) => s.status === 'Refunded').length;

  return (
    <div id="sales-invoices-view" className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Sales Invoices & Billing Ledger</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit historical sales, batch dispensing records, patient invoices, and returns.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadSalesData}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {onNavigateToPOS && (
            <button
              onClick={onNavigateToPOS}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
            >
              <span>+ Open New POS Sale</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Recorded Revenue</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            PKR {totalSalesRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
            Across {sales.length} transactions in Google Sheets
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Successful Invoices</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">{completedCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">
            Completed counter dispenses
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Refunded / Returned Bills</span>
          <div className="text-xl font-bold text-amber-700 mt-1">{returnedCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">
            Restocked back to batch inventory
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="px-6 pb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice number, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="JazzCash">JazzCash</option>
            <option value="Easypaisa">Easypaisa</option>
            <option value="Credit">Credit (Khata)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Refunded">Refunded</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer / Patient</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading invoices from Google Sheets...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No sales invoices found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const customer = customers.find((c) => c.customer_id === sale.customer_id);
                  const customerName = customer ? customer.customer_name : 'Walk-in Patient';

                  return (
                    <tr key={sale.sale_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {sale.invoice_number}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sale.sale_date || sale.created_at ? new Date(sale.sale_date || sale.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {customerName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {sale.sale_type || 'Retail'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            sale.payment_method === 'Cash'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : (sale.payment_method as string) === 'Credit'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {sale.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        PKR {Number(sale.total).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            sale.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sale.status === 'Refunded'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openSaleDetails(sale.sale_id)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      {selectedSaleDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Invoice #{selectedSaleDetails.sale?.invoice_number}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Date: {selectedSaleDetails.sale?.sale_date} • Cashier: {selectedSaleDetails.sale?.created_by}
                </p>
              </div>
              <button
                onClick={() => setSelectedSaleDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Customer and Payment Info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Customer / Patient
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedSaleDetails.sale?.customer_id === 'CUST-WALKIN'
                      ? 'Walk-in Patient'
                      : selectedSaleDetails.sale?.customer_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Payment Method
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {selectedSaleDetails.sale?.payment_method}
                  </span>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Dispensed Medicine Items:</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px]">
                      <tr>
                        <th className="p-2.5">Medicine</th>
                        <th className="p-2.5">Batch</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Price</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSaleDetails.items?.map((item: any, idx: number) => {
                        const prod = products.find((p) => p.product_id === item.product_id);
                        return (
                          <tr key={idx}>
                            <td className="p-2.5 font-medium text-slate-800">
                              {prod ? prod.product_name : item.product_id}
                            </td>
                            <td className="p-2.5 font-mono text-slate-500">{item.batch_id}</td>
                            <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                            <td className="p-2.5 text-right">PKR {Number(item.sale_price).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              PKR {Number(item.total).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bill Totals */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>PKR {Number(selectedSaleDetails.sale?.subtotal || 0).toLocaleString()}</span>
                </div>
                {Number(selectedSaleDetails.sale?.discount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-PKR {Number(selectedSaleDetails.sale?.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Payable Total:</span>
                  <span className="text-emerald-700">
                    PKR {Number(selectedSaleDetails.sale?.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              {selectedSaleDetails.sale?.status === 'Completed' ? (
                <button
                  onClick={handleOpenReturnModal}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Process Return / Refund</span>
                </button>
              ) : (
                <span className="text-xs text-rose-600 font-semibold">
                  Invoice status: {selectedSaleDetails.sale?.status}
                </span>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedSaleDetails(null)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Return & Stock Restock Modal */}
      {isReturnModalOpen && selectedSaleDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-rose-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Process Return & Restock</h3>
                <p className="text-[11px] text-rose-200">
                  Invoice #{selectedSaleDetails.sale?.invoice_number}
                </p>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="text-rose-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="text-slate-600">
                Select quantities to return. The returned stock will be automatically added back to
                its respective FEFO batch in Google Sheets:
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {returnItems.map((item, idx) => {
                  const prod = products.find((p) => p.product_id === item.product_id);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-slate-800">
                          {prod ? prod.product_name : item.product_id}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Batch: {item.batch_id} • Sold: {item.maxQty} units @ PKR {item.sale_price}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 text-[11px]">Return:</span>
                        <input
                          type="number"
                          min="0"
                          max={item.maxQty}
                          value={item.returnQty}
                          onChange={(e) => {
                            const val = Math.min(item.maxQty, Math.max(0, parseInt(e.target.value) || 0));
                            setReturnItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, returnQty: val } : it))
                            );
                          }}
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-bold text-center"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Reason for Return:</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs flex justify-between font-bold text-rose-900">
                <span>Total Refund Amount:</span>
                <span>
                  PKR{' '}
                  {returnItems
                    .reduce((sum, i) => sum + i.returnQty * i.sale_price, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingReturn}
                onClick={handleProcessReturn}
                className="px-6 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl flex items-center space-x-1.5 shadow-sm"
              >
                {isProcessingReturn ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Restocking Batches...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Confirm Return & Restock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
