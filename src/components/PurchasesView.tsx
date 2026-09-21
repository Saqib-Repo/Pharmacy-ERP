import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  Package,
  Layers,
  X,
  RefreshCw,
  Eye,
  Trash2,
} from 'lucide-react';
import { Purchase, Supplier, Product } from '../types';

interface PurchasesViewProps {
  onOpenSheetsModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToInventory?: () => void;
}

interface NewPurchaseItem {
  product_id: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity: number;
  free_quantity: number;
  purchase_price: number;
  sale_price: number;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  showToast,
}) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('All');

  // Purchase Details Modal
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);

  // Receive Stock Modal State
  const [isReceivingModalOpen, setIsReceivingModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'Card' | 'Credit'>('Bank');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [items, setItems] = useState<NewPurchaseItem[]>([
    {
      product_id: '',
      batch_number: '',
      manufacturing_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      quantity: 50,
      free_quantity: 0,
      purchase_price: 0,
      sale_price: 0,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchRes, suppRes, prodRes] = await Promise.all([
        fetch('/api/purchases').then((r) => r.json()),
        fetch('/api/suppliers').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
      ]);

      setPurchases(Array.isArray(purchRes) ? purchRes : []);
      setSuppliers(Array.isArray(suppRes) ? suppRes : []);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
    } catch (err: any) {
      showToast('Error loading purchases: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/purchases/${id}`);
      const data = await res.json();
      setSelectedPurchase(data);
    } catch (err: any) {
      showToast('Failed to load purchase details: ' + err.message, 'error');
    }
  };

  // Item helpers for inward stock modal
  const handleProductSelect = (index: number, prodId: string) => {
    const prod = products.find((p) => p.product_id === prodId);
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              product_id: prodId,
              purchase_price: prod ? Number(prod.purchase_price) : 0,
              sale_price: prod ? Number(prod.sale_price) : 0,
              batch_number: item.batch_number || `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
              expiry_date:
                item.expiry_date ||
                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            }
          : item
      )
    );
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: '',
        batch_number: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
        manufacturing_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        quantity: 50,
        free_quantity: 0,
        purchase_price: 0,
        sale_price: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.purchase_price, 0);
  const total = Math.max(0, subtotal - (discount || 0) + (tax || 0));

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      showToast('Please select a distributor / supplier', 'error');
      return;
    }
    if (!invoiceNumber.trim()) {
      showToast('Please enter distributor invoice number', 'error');
      return;
    }

    const invalidItems = items.filter((i) => !i.product_id || !i.batch_number || !i.expiry_date || i.quantity <= 0);
    if (invalidItems.length > 0) {
      showToast('Please fill all product, batch, expiry date, and quantity fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        supplier_id: supplierId,
        invoice_number: invoiceNumber,
        purchase_date: purchaseDate,
        payment_method: paymentMethod,
        discount: discount || 0,
        tax: tax || 0,
        paid_amount: Number(paidAmount) || total,
        items: items.map((i) => ({
          product_id: i.product_id,
          batch_number: i.batch_number,
          manufacturing_date: i.manufacturing_date,
          expiry_date: i.expiry_date,
          quantity: Number(i.quantity),
          free_quantity: Number(i.free_quantity || 0),
          purchase_price: Number(i.purchase_price),
          sale_price: Number(i.sale_price),
        })),
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive purchase');
      }

      showToast(`Inward stock received! Inward Batches added to Google Sheets.`, 'success');
      setIsReceivingModalOpen(false);
      // Reset form
      setSupplierId('');
      setInvoiceNumber('');
      setItems([
        {
          product_id: '',
          batch_number: '',
          manufacturing_date: new Date().toISOString().split('T')[0],
          expiry_date: '',
          quantity: 50,
          free_quantity: 0,
          purchase_price: 0,
          sale_price: 0,
        },
      ]);
      loadData();
    } catch (err: any) {
      showToast('Stock Receiving Error: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.supplier_id && p.supplier_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSupp = supplierFilter === 'All' || p.supplier_id === supplierFilter;
    return matchesSearch && matchesSupp;
  });

  const totalPurchasesCost = purchases.reduce((sum, p) => sum + Number(p.total || 0), 0);
  const totalPaid = purchases.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
  const outstandingPayables = Math.max(0, totalPurchasesCost - totalPaid);

  return (
    <div id="purchases-management-view" className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-emerald-700" />
            <h1 className="text-xl font-bold text-slate-900">Distributor Purchases & Inward Stock</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Receive pharmaceutical consignments from distributors and auto-generate FEFO batches in Google Sheets.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
            title="Refresh Purchases"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            id="open-receive-stock-modal-btn"
            onClick={() => {
              setInvoiceNumber(`INV-${Date.now().toString().slice(-5)}`);
              setIsReceivingModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Receive Inward Stock</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Total Consignment Value</span>
          <div className="text-xl font-bold text-slate-900 mt-1">
            PKR {totalPurchasesCost.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
            {purchases.length} Distributor Orders
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Settled to Distributors</span>
          <div className="text-xl font-bold text-emerald-700 mt-1">
            PKR {totalPaid.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Paid via Bank / Cheque / Cash</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Outstanding Payables</span>
          <div className="text-xl font-bold text-rose-700 mt-1">
            PKR {outstandingPayables.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 inline-block">Supplier credit balances</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="px-6 pb-3 flex items-center space-x-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search distributor invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="text-xs py-1.5 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="All">All Distributors</option>
          {suppliers.map((s, idx) => (
            <option key={`${s.supplier_id}-${idx}`} value={s.supplier_id}>
              {s.supplier_name}
            </option>
          ))}
        </select>
      </div>

      {/* Purchases Table */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Distributor</th>
                <th className="py-3 px-4">Purchase Date</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Invoice Total (PKR)</th>
                <th className="py-3 px-4 text-right">Paid (PKR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading purchases from Google Sheets...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No purchase consignments found. Click "+ Receive Inward Stock" to receive medicines.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const supp = suppliers.find((s) => s.supplier_id === p.supplier_id);
                  const suppName = supp ? supp.supplier_name : p.supplier_id;

                  return (
                    <tr key={p.purchase_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {p.invoice_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{suppName}</td>
                      <td className="py-3 px-4 text-slate-600">{p.purchase_date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        PKR {Number(p.total).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        PKR {Number(p.paid_amount || p.total).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.status || 'Received'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openDetails(p.purchase_id)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Batches</span>
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

      {/* Receive Inward Stock Modal */}
      {isReceivingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-bold text-sm">Receive Inward Pharmaceutical Consignment</h3>
                  <p className="text-[11px] text-emerald-200">
                    Creates Purchase record and adds new FEFO Batches directly into Google Sheets.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReceivingModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveStock} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Distributor & Invoice Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Distributor / Supplier *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="">Select Distributor...</option>
                    {suppliers.map((s, idx) => (
                      <option key={`${s.supplier_id}-${idx}`} value={s.supplier_id}>
                        {s.supplier_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Distributor Invoice # *</label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. GSK-90218"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                  >
                    <option value="Bank">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Credit">Credit (Pay Later)</option>
                  </select>
                </div>
              </div>

              {/* Items Line Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-sm">
                    Medicines & Batches Received in this Consignment:
                  </h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-3 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg font-bold text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs grid grid-cols-12 gap-2 items-end"
                    >
                      <div className="col-span-4">
                        <label className="text-slate-600 block text-[10px] font-semibold mb-1">
                          Product / Medicine *
                        </label>
                        <select
                          required
                          value={item.product_id}
                          onChange={(e) => handleProductSelect(index, e.target.value)}
                          className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded font-semibold text-xs"
                        >
                          <option value="">Select Drug...</option>
                          {products.map((p, pIdx) => (
                            <option key={`${p.product_id}-${pIdx}`} value={p.product_id}>
                              {p.product_name} ({p.strength || p.dosage_form})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-slate-600 block text-[10px] font-semibold mb-1">
                          Batch No. *
                        </label>
                        <input
                          type="text"
                          required
                          value={item.batch_number}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it, i) => (i === index ? { ...it, batch_number: e.target.value } : it))
                            )
                          }
                          className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded font-mono uppercase text-xs"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-slate-600 block text-[10px] font-semibold mb-1">
                          Expiry Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={item.expiry_date}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it, i) => (i === index ? { ...it, expiry_date: e.target.value } : it))
                            )
                          }
                          className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="text-slate-600 block text-[10px] font-semibold mb-1">
                          Qty *
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it, i) =>
                                i === index ? { ...it, quantity: parseInt(e.target.value) || 1 } : it
                              )
                            )
                          }
                          className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded font-bold text-center text-xs"
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="text-slate-600 block text-[10px] font-semibold mb-1">
                          Cost (PKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.purchase_price}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it, i) =>
                                i === index ? { ...it, purchase_price: parseFloat(e.target.value) || 0 } : it
                              )
                            )
                          }
                          className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded font-bold text-right text-xs"
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="text-slate-600 block text-[10px] font-semibold mb-1">
                          Sale (PKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.sale_price}
                          onChange={(e) =>
                            setItems((prev) =>
                              prev.map((it, i) =>
                                i === index ? { ...it, sale_price: parseFloat(e.target.value) || 0 } : it
                              )
                            )
                          }
                          className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded font-bold text-right text-xs"
                        />
                      </div>

                      <div className="col-span-1 flex justify-center pb-1">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Payments */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-slate-600">
                    Gross Inward Total: <strong>PKR {subtotal.toLocaleString()}</strong>
                  </div>
                  <div className="text-xs text-slate-500">
                    Consignment of {items.length} product lines
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <label className="text-slate-600 block text-[10px] font-semibold mb-0.5">
                      Paid Now (PKR):
                    </label>
                    <input
                      type="number"
                      value={paidAmount || total}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-32 p-1.5 bg-white border border-slate-300 rounded font-bold text-emerald-800 text-xs text-right"
                    />
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Payable Total:
                    </span>
                    <span className="text-base font-bold text-slate-900">
                      PKR {total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReceivingModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl flex items-center space-x-2 shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Writing Batches to Google Sheets...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Post Consignment to Stock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Details Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Consignment #{selectedPurchase.purchase?.invoice_number}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Supplier: {selectedPurchase.purchase?.supplier_id} • Date: {selectedPurchase.purchase?.purchase_date}
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="p-2.5">Medicine</th>
                      <th className="p-2.5">Batch #</th>
                      <th className="p-2.5">Expiry</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedPurchase.items?.map((item: any, idx: number) => {
                      const prod = products.find((p) => p.product_id === item.product_id);
                      return (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-900">
                            {prod ? prod.product_name : item.product_id}
                          </td>
                          <td className="p-2.5 font-mono text-slate-600">{item.batch_number}</td>
                          <td className="p-2.5 text-slate-600">{item.expiry_date}</td>
                          <td className="p-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="p-2.5 text-right font-semibold">
                            PKR {Number(item.purchase_price).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-bold text-slate-800">
                <span>Total Consignment Amount:</span>
                <span className="text-emerald-700">
                  PKR {Number(selectedPurchase.purchase?.total || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
