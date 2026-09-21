import React, { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  Building2,
  X,
  ExternalLink,
  ShieldAlert,
  Calendar,
  DollarSign,
  Package,
} from 'lucide-react';
import { Product, Category, Batch } from '../types';

interface ProductsViewProps {
  onOpenSheetsModal: () => void;
  onNavigateToInventory?: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  onOpenSheetsModal,
  onNavigateToInventory,
  showToast,
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDosageForm, setSelectedDosageForm] = useState('All');
  const [selectedStockStatus, setSelectedStockStatus] = useState('All');
  const [selectedRx, setSelectedRx] = useState('All');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [selectedProductForBatches, setSelectedProductForBatches] = useState<any | null>(null);
  const [isBatchesDrawerOpen, setIsBatchesDrawerOpen] = useState(false);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New product form
  const initialForm = {
    product_name: '',
    generic_name: '',
    brand_name: '',
    category: '',
    manufacturer: '',
    dosage_form: 'Tablet',
    strength: '',
    pack_size: '',
    unit: 'Pack',
    purchase_price: '',
    sale_price: '',
    retail_price: '',
    tax_rate: '0',
    reorder_level: '20',
    barcode: '',
    sku: '',
    prescription_required: false,
    controlled_medicine: false,
    // Optional initial batch
    include_initial_batch: true,
    batch_number: '',
    manufacturing_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    batch_quantity: '50',
    supplier_id: 'SUP-001',
  };

  const [formData, setFormData] = useState(initialForm);

  // New batch form for drawer
  const [newBatchData, setNewBatchData] = useState({
    batch_number: '',
    manufacturing_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    purchase_price: '',
    sale_price: '',
    quantity: '50',
    supplier_id: 'SUP-001',
  });

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/categories').then((r) => r.json()),
      ]);
      setProducts(Array.isArray(pRes) ? pRes : []);
      setCategories(Array.isArray(cRes) ? cRes : []);
    } catch (err: any) {
      showToast('Error loading medicines from Google Sheets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name || !formData.category || !formData.sale_price) {
      showToast('Please fill in required fields (Name, Category, Sale Price)', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const payload: any = {
        product_name: formData.product_name,
        generic_name: formData.generic_name,
        brand_name: formData.brand_name || formData.product_name,
        category: formData.category,
        manufacturer: formData.manufacturer || 'Local Pharma',
        dosage_form: formData.dosage_form,
        strength: formData.strength,
        pack_size: formData.pack_size || '1 Pack',
        unit: formData.unit || 'Pack',
        purchase_price: Number(formData.purchase_price) || 0,
        sale_price: Number(formData.sale_price) || 0,
        retail_price: Number(formData.retail_price || formData.sale_price) || 0,
        tax_rate: Number(formData.tax_rate) || 0,
        reorder_level: Number(formData.reorder_level) || 10,
        barcode: formData.barcode || undefined,
        sku: formData.sku || undefined,
        prescription_required: formData.prescription_required,
        controlled_medicine: formData.controlled_medicine,
      };

      if (formData.include_initial_batch && formData.batch_number && formData.expiry_date) {
        payload.initial_batch = {
          batch_number: formData.batch_number,
          manufacturing_date: formData.manufacturing_date,
          expiry_date: formData.expiry_date,
          quantity: Number(formData.batch_quantity) || 1,
          supplier_id: formData.supplier_id,
        };
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Medicine "${formData.product_name}" synced to Google Sheets!`, 'success');
        setIsAddModalOpen(false);
        setFormData(initialForm);
        fetchProductsAndCategories();
      } else {
        showToast(data.error || 'Failed to create product', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/products/${editingProduct.product_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Medicine "${editingProduct.product_name}" updated in Google Sheets!`, 'success');
        setIsEditModalOpen(false);
        setEditingProduct(null);
        fetchProductsAndCategories();
      } else {
        showToast(data.error || 'Failed to update product', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProduct = async (product: any) => {
    if (!confirm(`Are you sure you want to deactivate "${product.product_name}"?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/products/${product.product_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast(`Medicine "${product.product_name}" archived in Google Sheet.`, 'success');
        fetchProductsAndCategories();
      } else {
        showToast(data.error || 'Failed to archive product', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting product', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForBatches || !newBatchData.batch_number || !newBatchData.expiry_date) {
      showToast('Batch number and expiry date are required', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProductForBatches.product_id,
          batch_number: newBatchData.batch_number,
          manufacturing_date: newBatchData.manufacturing_date,
          expiry_date: newBatchData.expiry_date,
          purchase_price: Number(newBatchData.purchase_price || selectedProductForBatches.purchase_price),
          sale_price: Number(newBatchData.sale_price || selectedProductForBatches.sale_price),
          quantity: Number(newBatchData.quantity) || 10,
          supplier_id: newBatchData.supplier_id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Batch "${newBatchData.batch_number}" added to Google Sheets Batches!`, 'success');
        setIsAddBatchModalOpen(false);
        // Refresh product details
        const updated = await fetch(`/api/products/${selectedProductForBatches.product_id}`).then((r) => r.json());
        setSelectedProductForBatches(updated);
        fetchProductsAndCategories();
      } else {
        showToast(data.error || 'Failed to add batch', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving batch', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        p.product_name?.toLowerCase().includes(q) ||
        p.generic_name?.toLowerCase().includes(q) ||
        p.brand_name?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.manufacturer?.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (selectedDosageForm !== 'All' && p.dosage_form !== selectedDosageForm) return false;
    if (selectedRx !== 'All') {
      if (selectedRx === 'Rx Required' && !p.prescription_required) return false;
      if (selectedRx === 'OTC (No Rx)' && p.prescription_required) return false;
    }

    if (selectedStockStatus !== 'All') {
      if (selectedStockStatus === 'In Stock' && p.total_stock <= (p.reorder_level || 0)) return false;
      if (selectedStockStatus === 'Low Stock' && (p.total_stock === 0 || p.total_stock > (p.reorder_level || 0))) return false;
      if (selectedStockStatus === 'Out of Stock' && p.total_stock > 0) return false;
    }

    return true;
  });

  const dosageForms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Eye Drops', 'Suspension', 'Inhaler', 'Sachet'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Medicine & Product Catalog</h1>
              <p className="text-xs text-slate-700">
                Commercial pharmaceutical master database with multi-batch FEFO tracking synchronized to Google Sheets.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-open-sheets-sync"
            onClick={onOpenSheetsModal}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors flex items-center space-x-1.5"
            title="Inspect Google Sheet database"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sheet Database</span>
          </button>

          <button
            id="btn-refresh-products"
            onClick={fetchProductsAndCategories}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors"
            title="Refresh from Google Sheets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-add-product"
            onClick={() => {
              setFormData({
                ...initialForm,
                category: categories[0]?.category_name || 'Analgesics & Antipyretics',
              });
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by brand name, generic formula, barcode, SKU, manufacturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_name}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Dosage Form Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedDosageForm}
              onChange={(e) => setSelectedDosageForm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Forms</option>
              {dosageForms.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Stock Levels</option>
              <option value="In Stock">In Stock (&gt; Reorder)</option>
              <option value="Low Stock">Low Stock (≤ Reorder)</option>
              <option value="Out of Stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Rx Filter */}
          <div className="w-full md:w-36">
            <select
              value={selectedRx}
              onChange={(e) => setSelectedRx(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Rx Status</option>
              <option value="Rx Required">Prescription Only (Rx)</option>
              <option value="OTC (No Rx)">OTC (No Rx)</option>
            </select>
          </div>
        </div>

        {/* Quick Result Summary */}
        <div className="flex items-center justify-between text-xs text-slate-700 pt-1 px-1">
          <span>
            Showing <strong className="text-slate-800">{filteredProducts.length}</strong> of{' '}
            <strong className="text-slate-800">{products.length}</strong> medicines
          </span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>In Stock</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Low Stock</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Near Expiry / Quarantined</span>
            </span>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Medicine & Formula</th>
                <th className="py-3.5 px-3">Category & Form</th>
                <th className="py-3.5 px-3">Identifiers</th>
                <th className="py-3.5 px-3 text-right">Cost (PKR)</th>
                <th className="py-3.5 px-3 text-right">Price (PKR)</th>
                <th className="py-3.5 px-3 text-center">Current Stock</th>
                <th className="py-3.5 px-3 text-center">Batches & Expiry</th>
                <th className="py-3.5 px-3 text-center">Rx</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-700">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Querying live Google Sheets database...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-700">
                    <p className="text-sm font-medium">No medicines match your current filters.</p>
                    <p className="text-xs mt-1">Try resetting the category, stock level, or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product, idx) => {
                  const isLow = product.total_stock > 0 && product.total_stock <= (product.reorder_level || 0);
                  const isOut = product.total_stock === 0;
                  const marginPct =
                    product.sale_price > 0 && product.purchase_price > 0
                      ? Math.round(((product.sale_price - product.purchase_price) / product.sale_price) * 100)
                      : 0;

                  return (
                    <tr key={`${product.product_id}-${idx}`} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Product Name & Generic */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{product.product_name}</div>
                        <div className="text-[11px] text-slate-700 italic font-mono mt-0.5">
                          {product.generic_name || 'Generic formula not specified'}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          Mfg: <span className="font-medium text-slate-700">{product.manufacturer}</span>
                        </div>
                      </td>

                      {/* Category & Dosage Form */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {product.category}
                        </span>
                        <div className="text-[11px] font-medium text-slate-700 mt-1">
                          {product.dosage_form} {product.strength ? `(${product.strength})` : ''}
                        </div>
                        <div className="text-[10px] text-slate-600">{product.pack_size}</div>
                      </td>

                      {/* Identifiers (Barcode & SKU) */}
                      <td className="py-3.5 px-3 font-mono text-[11px]">
                        <div className="text-slate-800 font-medium">{product.sku}</div>
                        <div className="text-[10px] text-slate-600">{product.barcode}</div>
                      </td>

                      {/* Purchase Price */}
                      <td className="py-3.5 px-3 text-right font-medium text-slate-600">
                        ₨ {Number(product.purchase_price).toLocaleString()}
                      </td>

                      {/* Sale Price & Margin */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="font-bold text-slate-900">
                          ₨ {Number(product.sale_price).toLocaleString()}
                        </div>
                        {marginPct > 0 && (
                          <div className="text-[10px] text-emerald-600 font-medium">+{marginPct}% margin</div>
                        )}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-3 text-center">
                        <div
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            isOut
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {product.total_stock} {product.unit || 'Units'}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5">
                          Reorder: {product.reorder_level || 10}
                        </div>
                      </td>

                      {/* Batches & Expiry info */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedProductForBatches(product);
                            setIsBatchesDrawerOpen(true);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg text-xs font-medium border border-slate-200 hover:border-emerald-200 transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{product.batches_count || 0} Batches</span>
                        </button>

                        {product.nearest_expiry && (
                          <div className="text-[10px] mt-1">
                            <span
                              className={`font-semibold ${
                                product.expiry_status === 'expired'
                                  ? 'text-rose-600'
                                  : product.expiry_status === 'expiring_30'
                                  ? 'text-amber-600'
                                  : 'text-slate-600'
                              }`}
                            >
                              Exp: {product.nearest_expiry}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Rx Badge */}
                      <td className="py-3.5 px-3 text-center">
                        {product.prescription_required ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold text-[10px] rounded-md border border-purple-200" title="Prescription Required by Law">
                            Rx
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-medium text-[10px] rounded-md" title="Over the Counter">
                            OTC
                          </span>
                        )}
                        {product.controlled_medicine && (
                          <div className="text-[9px] text-rose-600 font-bold uppercase mt-0.5">
                            Controlled
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedProductForBatches(product);
                              setIsBatchesDrawerOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Inspect Batches & Expiries"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingProduct({ ...product });
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Medicine Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Deactivate / Archive Medicine"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: ADD NEW MEDICINE                                   */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add New Medicine</h3>
                  <p className="text-xs text-slate-500">Record medicine details and initial FEFO stock batch to Google Sheets</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product / Brand Trade Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Panadol 500mg Tablets, Augmentin 625mg"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Formula Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol, Co-Amoxiclav, Ibuprofen"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. GSK Pakistan, Abbott, Getz Pharma"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_name}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage Form</label>
                  <select
                    value={formData.dosage_form}
                    onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                  >
                    {dosageForms.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Strength (e.g. 500mg, 20mg)</label>
                  <input
                    type="text"
                    placeholder="500mg, 10ml, 625mg"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pack Size (e.g. 20x10 Strips)</label>
                  <input
                    type="text"
                    placeholder="20 Strips, 14 Capsules"
                    value={formData.pack_size}
                    onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Pricing & Reorder */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  Commercial Pricing & Reorder Threshold
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Price (₨)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sale Price (₨) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.sale_price}
                      onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level</label>
                    <input
                      type="number"
                      value={formData.reorder_level}
                      onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Legal & Regulatory */}
              <div className="pt-2 border-t border-slate-100 flex items-center space-x-6">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.prescription_required}
                    onChange={(e) => setFormData({ ...formData, prescription_required: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Prescription Required (Rx Only)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.controlled_medicine}
                    onChange={(e) => setFormData({ ...formData, controlled_medicine: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>Controlled Substance / Schedule D</span>
                </label>
              </div>

              {/* Initial FEFO Batch Inward */}
              <div className="pt-2 border-t border-slate-100 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center space-x-2 text-xs font-bold text-emerald-950 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.include_initial_batch}
                      onChange={(e) => setFormData({ ...formData, include_initial_batch: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Create Initial FEFO Batch Inward</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-medium">Automatic FEFO registration</span>
                </div>

                {formData.include_initial_batch && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Batch Number *</label>
                      <input
                        type="text"
                        placeholder="e.g. BTH-2026-01"
                        value={formData.batch_number}
                        onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Expiry Date *</label>
                      <input
                        type="date"
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Initial Units</label>
                      <input
                        type="number"
                        value={formData.batch_quantity}
                        onChange={(e) => setFormData({ ...formData, batch_quantity: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save to Google Sheets</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT MEDICINE                                      */}
      {/* ========================================================= */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit {editingProduct.product_name}</h3>
                  <p className="text-xs text-slate-500">Update pricing, reorder rules, and medicine properties</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.product_name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, product_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name</label>
                  <input
                    type="text"
                    value={editingProduct.generic_name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, generic_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_name}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Cost (₨)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.purchase_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, purchase_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sale Price (₨)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.sale_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sale_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reorder Level Threshold</label>
                  <input
                    type="number"
                    value={editingProduct.reorder_level}
                    onChange={(e) => setEditingProduct({ ...editingProduct, reorder_level: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingProduct.status}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.prescription_required)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, prescription_required: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Prescription Required (Rx)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.controlled_medicine)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, controlled_medicine: e.target.checked })}
                    className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>Controlled Medicine</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5"
                >
                  {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER: PRODUCT BATCHES & EXPIRY TIMELINES                */}
      {/* ========================================================= */}
      {isBatchesDrawerOpen && selectedProductForBatches && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/75 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                    FEFO BATCH INSPECTOR
                  </span>
                  <span className="text-xs text-slate-700 font-mono">{selectedProductForBatches.sku}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {selectedProductForBatches.product_name}
                </h2>
                <p className="text-xs text-slate-700 italic">
                  {selectedProductForBatches.generic_name} • Total Units: {selectedProductForBatches.total_stock}
                </p>
              </div>
              <button
                onClick={() => setIsBatchesDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Active Batches in Chronological FEFO Order
                </h3>
                <button
                  onClick={() => {
                    setNewBatchData({
                      batch_number: `BTH-${Date.now().toString().slice(-4)}`,
                      manufacturing_date: new Date().toISOString().split('T')[0],
                      expiry_date: '',
                      purchase_price: String(selectedProductForBatches.purchase_price || ''),
                      sale_price: String(selectedProductForBatches.sale_price || ''),
                      quantity: '50',
                      supplier_id: 'SUP-001',
                    });
                    setIsAddBatchModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Inward New Batch</span>
                </button>
              </div>

              {/* Batches Cards */}
              {(!selectedProductForBatches.batches || selectedProductForBatches.batches.length === 0) ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-700 text-xs">
                  <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-semibold">No batches recorded yet</p>
                  <p className="mt-1">Add an inward batch to activate stock for this medicine.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedProductForBatches.batches.map((batch: any, index: number) => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const isExpired = batch.expiry_date < todayStr;
                    const diffDays = Math.ceil(
                      (new Date(batch.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isNearExpiry = !isExpired && diffDays <= 60;

                    return (
                      <div
                        key={batch.batch_id}
                        className={`p-4 rounded-xl border transition-all ${
                          isExpired
                            ? 'bg-rose-50/50 border-rose-200'
                            : isNearExpiry
                            ? 'bg-amber-50/50 border-amber-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm font-bold text-slate-900">
                                {batch.batch_number}
                              </span>
                              {index === 0 && !isExpired && (
                                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-md">
                                  1ST FEFO PICK
                                </span>
                              )}
                              {isExpired && (
                                <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-md flex items-center space-x-1">
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>EXPIRED & QUARANTINED</span>
                                </span>
                              )}
                              {isNearExpiry && (
                                <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-md">
                                  EXPIRING SOON ({diffDays}d)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-700 mt-1 flex items-center space-x-3">
                              <span>Mfg: {batch.manufacturing_date}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-800">Exp: {batch.expiry_date}</span>
                              {diffDays > 0 && <span>({diffDays} days remaining)</span>}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-base font-extrabold text-slate-900">
                              {batch.remaining_quantity}{' '}
                              <span className="text-xs font-normal text-slate-700">
                                / {batch.quantity} units
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-700">
                              Cost: ₨{batch.purchase_price} • Sale: ₨{batch.sale_price}
                            </div>
                          </div>
                        </div>

                        {/* Visual stock bar */}
                        <div className="mt-3">
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isExpired
                                  ? 'bg-rose-500'
                                  : isNearExpiry
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((Number(batch.remaining_quantity) / Number(batch.quantity)) * 100)
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-700">Batches stored in Google Sheet: <strong>Batches</strong></span>
              <button
                onClick={() => setIsBatchesDrawerOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD BATCH                                          */}
      {/* ========================================================= */}
      {isAddBatchModalOpen && selectedProductForBatches && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Inward Batch for {selectedProductForBatches.product_name}
              </h3>
              <button onClick={() => setIsAddBatchModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GSK-26A01"
                  value={newBatchData.batch_number}
                  onChange={(e) => setNewBatchData({ ...newBatchData, batch_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mfg Date</label>
                  <input
                    type="date"
                    value={newBatchData.manufacturing_date}
                    onChange={(e) => setNewBatchData({ ...newBatchData, manufacturing_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={newBatchData.expiry_date}
                    onChange={(e) => setNewBatchData({ ...newBatchData, expiry_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={newBatchData.quantity}
                    onChange={(e) => setNewBatchData({ ...newBatchData, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost (₨)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBatchData.purchase_price}
                    onChange={(e) => setNewBatchData({ ...newBatchData, purchase_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sale (₨)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBatchData.sale_price}
                    onChange={(e) => setNewBatchData({ ...newBatchData, sale_price: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBatchModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1"
                >
                  {actionLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  <span>Add Batch to Sheet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
