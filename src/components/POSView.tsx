import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  X,
  RefreshCw,
  Package,
  Calendar,
  Layers,
} from 'lucide-react';
import { Product, Batch, Customer } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
  sale_price: number;
  discount: number;
  availableStock: number;
  earliestExpiry?: string;
  batchCount: number;
}

interface POSViewProps {
  onOpenSheetsModal: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToInvoices?: () => void;
  onNavigateToSales?: () => void;
}

export const POSView: React.FC<POSViewProps> = ({
  showToast,
  onNavigateToInvoices,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [saleType, setSaleType] = useState<'Retail' | 'Prescription' | 'Wholesale'>('Retail');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);

  // Payment drawer & checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'JazzCash' | 'Easypaisa' | 'Credit'>('Cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Completed sale receipt modal
  const [completedSale, setCompletedSale] = useState<any | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load products, batches, and customers
  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, batchRes, custRes] = await Promise.all([
        fetch('/api/products').then((r) => r.json()),
        fetch('/api/batches').then((r) => r.json()),
        fetch('/api/customers').then((r) => r.json()),
      ]);

      setProducts(Array.isArray(prodRes) ? prodRes : []);
      setBatches(Array.isArray(batchRes) ? batchRes : []);
      setCustomers(Array.isArray(custRes) ? custRes : []);
    } catch (err: any) {
      showToast('Failed to load POS data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute available stock per product from valid active batches
  const productStockMap = React.useMemo(() => {
    const map = new Map<string, { total: number; earliestExpiry?: string; batchCount: number }>();
    const today = new Date().toISOString().split('T')[0];

    batches.forEach((b) => {
      // Exclude expired batches or zero stock
      if (b.remaining_quantity <= 0) return;
      const isExpired = b.expiry_date < today;
      if (isExpired) return;

      const current = map.get(b.product_id) || { total: 0, earliestExpiry: undefined, batchCount: 0 };
      current.total += Number(b.remaining_quantity || 0);
      current.batchCount += 1;
      if (!current.earliestExpiry || b.expiry_date < current.earliestExpiry) {
        current.earliestExpiry = b.expiry_date;
      }
      map.set(b.product_id, current);
    });

    return map;
  }, [batches]);

  // Categories list
  const categories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      if (p.status === 'Inactive') return false;
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.product_name.toLowerCase().includes(q) ||
        p.generic_name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        (p.brand_name && p.brand_name.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add item to cart
  const addToCart = (product: Product) => {
    const stockInfo = productStockMap.get(product.product_id) || { total: 0, batchCount: 0 };
    if (stockInfo.total <= 0) {
      showToast(`${product.product_name} is currently OUT OF STOCK!`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= stockInfo.total) {
          showToast(`Cannot add more than available stock (${stockInfo.total})`, 'error');
          return prev;
        }
        return prev.map((item) =>
          item.product.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            sale_price: Number(product.sale_price) || 0,
            discount: 0,
            availableStock: stockInfo.total,
            earliestExpiry: stockInfo.earliestExpiry,
            batchCount: stockInfo.batchCount,
          },
        ];
      }
    });
  };

  // Barcode scan handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = products.find((p) => p.barcode === barcodeInput.trim());
    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      showToast(`No product matched barcode: ${barcodeInput}`, 'error');
    }
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.product_id === productId) {
          if (newQty > item.availableStock) {
            showToast(`Max available stock is ${item.availableStock}`, 'error');
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const updateItemDiscount = (productId: string, discountVal: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.product_id === productId
          ? { ...item, discount: Math.max(0, discountVal) }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setOverallDiscount(0);
    setCashTendered('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.sale_price, 0);
  const itemsDiscount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  const totalDiscount = itemsDiscount + (overallDiscount || 0);
  const tax = 0; // standard pharma in PK is usually exempt or embedded
  const grandTotal = Math.max(0, subtotal - totalDiscount + tax);

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);

  // Submit checkout to server
  const handleConfirmCheckout = async () => {
    if (cart.length === 0) {
      showToast('Cart is empty', 'error');
      return;
    }

    if (paymentMethod === 'Credit' && !selectedCustomer) {
      showToast('Customer account must be selected for Credit / Khata sale!', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        customer_id: selectedCustomer ? selectedCustomer.customer_id : 'CUST-WALKIN',
        payment_method: paymentMethod,
        sale_type: saleType,
        items: cart.map((item) => ({
          product_id: item.product.product_id,
          quantity: item.quantity,
          sale_price: item.sale_price,
          discount: item.discount || 0,
        })),
        discount: totalDiscount,
        tax: tax,
        paid_amount: paymentMethod === 'Credit' ? 0 : grandTotal,
      };

      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Checkout failed');
      }

      showToast(`Sale completed! Invoice #${data.sale.invoice_number}`, 'success');
      setCompletedSale({
        ...data.sale,
        items: data.items,
        allocatedBatches: data.allocatedBatches,
        cashTendered: tenderedNum,
        changeDue: changeDue,
        customerName: selectedCustomer ? selectedCustomer.customer_name : 'Walk-in Patient',
      });
      setIsCheckoutOpen(false);
      clearCart();
      // Reload inventory batches
      loadData();
    } catch (err: any) {
      showToast('Checkout Error: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="pos-counter-view" className="h-full flex flex-col bg-slate-100 overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              Live Point of Sale (POS) Counter
            </h1>
            <p className="text-xs text-slate-500">
              FEFO Automated Dispensing & Real-time Stock Deduction
            </p>
          </div>
        </div>

        {/* Quick Barcode Scanner & Refresh */}
        <div className="flex items-center space-x-3">
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode or SKU..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-56 pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          </form>

          <button
            id="refresh-pos-data-btn"
            onClick={loadData}
            disabled={loading}
            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Refresh Products & Batches"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Catalog / Right Cart */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Product Catalog */}
        <div className="flex-1 flex flex-col border-r border-slate-200 overflow-hidden bg-slate-50">
          {/* Catalog Filters */}
          <div className="p-4 bg-white border-b border-slate-200 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search medicines by brand name, formula/generic, barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mr-2 text-emerald-600" />
                Loading live drug catalog from Google Sheets...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Package className="w-12 h-12 mb-2 text-slate-300" />
                <p className="text-sm font-medium">No active medicines found</p>
                <p className="text-xs">Try adjusting your search filter or add products in the Products module.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((product, idx) => {
                  const stockInfo = productStockMap.get(product.product_id) || { total: 0, batchCount: 0 };
                  const inCartItem = cart.find((i) => i.product.product_id === product.product_id);
                  const isOutOfStock = stockInfo.total <= 0;

                  return (
                    <div
                      key={`${product.product_id}-${idx}`}
                      onClick={() => !isOutOfStock && addToCart(product)}
                      className={`bg-white rounded-xl border p-3.5 flex flex-col justify-between transition-all cursor-pointer select-none text-left relative ${
                        isOutOfStock
                          ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-100'
                          : inCartItem
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-emerald-400 hover:shadow-xs'
                      }`}
                    >
                      {inCartItem && (
                        <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-xs">
                          {inCartItem.quantity}
                        </span>
                      )}

                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="text-[10px] uppercase font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 truncate">
                            {product.category || 'General'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {product.dosage_form || 'Tab'}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {product.product_name}
                        </h3>
                        <p className="text-[11px] text-slate-500 italic truncate mb-2">
                          {product.generic_name} {product.strength ? `• ${product.strength}` : ''}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 mt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-500">Price:</span>
                          <span className="font-bold text-slate-900">
                            PKR {Number(product.sale_price).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] mt-1">
                          <span className="text-slate-500 flex items-center">
                            <Layers className="w-3 h-3 mr-1 text-slate-400" />
                            Stock:
                          </span>
                          <span
                            className={`font-semibold ${
                              isOutOfStock
                                ? 'text-rose-600'
                                : stockInfo.total <= (product.reorder_level || 5)
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {stockInfo.total > 0 ? `${stockInfo.total} units` : 'Out of Stock'}
                          </span>
                        </div>

                        {stockInfo.earliestExpiry && (
                          <div className="flex items-center text-[10px] text-slate-500 mt-1">
                            <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                            FEFO Expiry: {stockInfo.earliestExpiry}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Active Cart & Bill Summary */}
        <div className="w-96 bg-white flex flex-col justify-between border-l border-slate-200 shadow-sm">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-emerald-700" />
                <h2 className="text-sm font-bold text-slate-900">Current Cart</h2>
                <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {cart.length} items
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Customer Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-slate-400" /> Patient / Customer:
                </span>
                <span className="text-slate-500 text-[11px]">
                  {selectedCustomer ? selectedCustomer.customer_type : 'Walk-in'}
                </span>
              </div>
              <select
                value={selectedCustomer ? selectedCustomer.customer_id : ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const c = customers.find((cust) => cust.customer_id === id);
                  setSelectedCustomer(c || null);
                }}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Walk-in Patient (General Retail)</option>
                {customers.map((c, idx) => (
                  <option key={`${c.customer_id}-${idx}`} value={c.customer_id}>
                    {c.customer_name} ({c.phone || 'No phone'}) - Bal: PKR {Number(c.opening_balance || 0).toLocaleString()}
                  </option>
                ))}
              </select>

              {/* Sale Type Pills */}
              <div className="flex items-center space-x-1 pt-1">
                {(['Retail', 'Prescription', 'Wholesale'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSaleType(type)}
                    className={`flex-1 text-[11px] py-1 rounded font-medium border transition-colors ${
                      saleType === type
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-8">
                <ShoppingCart className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">Cart is empty</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                  Click on any medicine from the catalog or scan a barcode to add it to this bill.
                </p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={`${item.product.product_id}-${idx}`} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                      <div className="text-xs font-bold text-slate-800 line-clamp-1">
                        {item.product.product_name}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <span>PKR {item.sale_price} / unit</span>
                        {item.earliestExpiry && (
                          <span className="text-teal-700 bg-teal-50 px-1 rounded">
                            Exp: {item.earliestExpiry}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.product_id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity and Line Total */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => updateQuantity(item.product.product_id, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.availableStock}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.product.product_id, parseInt(e.target.value) || 1)
                        }
                        className="w-12 text-center text-xs py-0.5 border border-slate-200 rounded font-semibold text-slate-800"
                      />
                      <button
                        onClick={() => updateQuantity(item.product.product_id, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        PKR {(item.quantity * item.sale_price - (item.discount || 0)).toLocaleString()}
                      </div>
                      {item.discount > 0 && (
                        <div className="text-[10px] text-emerald-600">
                          -PKR {item.discount} disc
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Bottom Summary & Checkout Button */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">PKR {subtotal.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center">Discount (PKR)</span>
              <input
                type="number"
                min="0"
                value={overallDiscount || ''}
                placeholder="0"
                onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                className="w-20 text-right text-xs px-2 py-0.5 bg-white border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Payable Total:</span>
              <span className="text-emerald-700 text-base">PKR {grandTotal.toLocaleString()}</span>
            </div>

            <button
              id="proceed-checkout-btn"
              disabled={cart.length === 0}
              onClick={() => {
                setCashTendered(grandTotal.toString());
                setIsCheckoutOpen(true);
              }}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm ${
                cart.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer active:scale-98'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Collect Payment (PKR {grandTotal.toLocaleString()})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment & Final Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Confirm Counter Payment</h3>
                <p className="text-xs text-emerald-200">
                  {cart.length} items • {selectedCustomer ? selectedCustomer.customer_name : 'Walk-in Patient'}
                </p>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Select Payment Method:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Cash', label: 'Cash', icon: Banknote },
                    { id: 'Card', label: 'Card / POS', icon: CreditCard },
                    { id: 'JazzCash', label: 'JazzCash', icon: Smartphone },
                    { id: 'Easypaisa', label: 'Easypaisa', icon: Smartphone },
                    { id: 'Credit', label: 'Credit (Khata)', icon: User },
                  ].map((pm) => {
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                          paymentMethod === pm.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{pm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Items Total:</span>
                  <span>PKR {subtotal.toLocaleString()}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount Applied:</span>
                    <span>-PKR {totalDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Net Due:</span>
                  <span className="text-emerald-700">PKR {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Cash Tendered & Change if Cash */}
              {paymentMethod === 'Cash' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Cash Tendered from Customer (PKR):
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder="Enter cash given by patient..."
                    className="w-full text-base font-bold text-slate-900 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />

                  <div className="flex items-center justify-between text-xs p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <span className="text-emerald-800 font-medium">Change to Return:</span>
                    <span className="text-sm font-bold text-emerald-900">
                      PKR {changeDue.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'Credit' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    This sale will be charged to the patient's Khata account (
                    <strong>{selectedCustomer?.customer_name || 'No customer selected'}</strong>
                    ) with remaining balance PKR{' '}
                    {Number(selectedCustomer?.opening_balance || 0).toLocaleString()}.
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                id="submit-sale-btn"
                disabled={isProcessing}
                onClick={handleConfirmCheckout}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl flex items-center space-x-2 shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deducting Stock in Sheets...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete & Print Bill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Thermal Print Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold">Receipt #{completedSale.invoice_number}</span>
              </div>
              <button
                onClick={() => setCompletedSale(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Receipt Content */}
            <div
              id="printable-pos-receipt"
              className="p-6 overflow-y-auto font-mono text-xs text-slate-800 bg-white"
            >
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  Shaheen Medicos & Pharmacy
                </h2>
                <p className="text-[10px] text-slate-500">
                  Plot 14-B, Blue Area, Islamabad, Pakistan
                </p>
                <p className="text-[10px] text-slate-500">Tel: +92-51-2873400 • NTN: 4120938-1</p>
                <div className="text-[10px] mt-1 font-bold text-slate-700">
                  INVOICE #{completedSale.invoice_number}
                </div>
                <div className="text-[9px] text-slate-500">
                  Date: {new Date(completedSale.created_at || Date.now()).toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500">
                  Cashier: {completedSale.created_by || 'Cashier Counter 01'}
                </div>
                <div className="text-[9px] text-slate-500">
                  Customer: {completedSale.customerName || 'Walk-in Patient'}
                </div>
              </div>

              {/* Items Table */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
                {completedSale.items &&
                  completedSale.items.map((item: any, idx: number) => {
                    const prod = products.find((p) => p.product_id === item.product_id);
                    return (
                      <div key={idx} className="text-[11px]">
                        <div className="font-semibold text-slate-900">
                          {prod ? prod.product_name : item.product_id}
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-600">
                          <span>
                            {item.quantity} x PKR {Number(item.sale_price).toLocaleString()}
                          </span>
                          <span className="font-semibold">
                            PKR {(item.quantity * item.sale_price - (item.discount || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Totals */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>PKR {Number(completedSale.subtotal || 0).toLocaleString()}</span>
                </div>
                {Number(completedSale.discount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>-PKR {Number(completedSale.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>PKR {Number(completedSale.total || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Paid ({completedSale.payment_method}):</span>
                  <span>PKR {Number(completedSale.paid_amount || completedSale.total).toLocaleString()}</span>
                </div>
                {completedSale.changeDue > 0 && (
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Change Returned:</span>
                    <span>PKR {Number(completedSale.changeDue).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* FEFO Dispensed Batches Details */}
              {completedSale.allocatedBatches && completedSale.allocatedBatches.length > 0 && (
                <div className="py-2 border-b border-dashed border-slate-300 text-[9px] text-slate-500">
                  <div className="font-bold text-slate-700 mb-1">FEFO Batch Log:</div>
                  {completedSale.allocatedBatches.map((ab: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {ab.product_id} (Batch {ab.batch_number}):
                      </span>
                      <span>
                        {ab.deducted_quantity} units (Exp: {ab.expiry_date})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="text-center pt-3 text-[9px] text-slate-500">
                <p className="font-semibold text-slate-700">Thank You For Visiting!</p>
                <p>Medicines once sold can be returned within 3 days with original bill.</p>
                <p>Keep out of reach of children. Store below 25°C.</p>
                <div className="font-mono text-[10px] mt-2 tracking-widest text-slate-400">
                  * {completedSale.invoice_number} *
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setCompletedSale(null);
                  if (onNavigateToInvoices) onNavigateToInvoices();
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                View in Sales
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setCompletedSale(null)}
                  className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg"
                >
                  New Sale (ESC)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
