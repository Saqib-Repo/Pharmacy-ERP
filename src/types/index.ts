/**
 * Core TypeScript Definitions for Pharmacy ERP (PharmaPulse)
 */

export type UserRole =
  | 'Owner'
  | 'Administrator'
  | 'Manager'
  | 'Pharmacist'
  | 'Cashier'
  | 'Inventory Manager'
  | 'Accountant';

export interface Company {
  company_id: string;
  company_name: string;
  legal_name: string;
  pharmacy_name: string;
  owner_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
  country: string;
  ntn: string;
  strn: string;
  logo_url: string;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  user_id: string;
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  last_login: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  role_id: string;
  role_name: UserRole;
  description: string;
  permissions: string[]; // array of permission slugs
  status: 'Active' | 'Inactive';
}

export interface Product {
  product_id: string;
  barcode: string;
  sku: string;
  product_name: string;
  generic_name: string;
  brand_name: string;
  category: string;
  manufacturer: string;
  dosage_form: string;
  strength: string;
  pack_size: string;
  unit: string;
  purchase_price: number;
  sale_price: number;
  retail_price: number;
  tax_rate: number;
  reorder_level: number;
  prescription_required: boolean;
  controlled_medicine: boolean;
  status: 'Active' | 'Inactive' | 'Discontinued';
  created_at: string;
  updated_at: string;
}

export interface Category {
  category_id: string;
  category_name: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface Batch {
  batch_id: string;
  product_id: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  remaining_quantity: number;
  supplier_id: string;
  purchase_invoice_id: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  supplier_id: string;
  supplier_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  ntn: string;
  strn: string;
  payment_terms: string;
  credit_limit: number;
  opening_balance: number;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface Customer {
  customer_id: string;
  customer_code: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  customer_type: 'Walk-in' | 'Regular' | 'Corporate';
  opening_balance: number;
  credit_limit: number;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  purchase_id: string;
  invoice_number: string;
  supplier_id: string;
  purchase_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  payment_method: 'Cash' | 'Bank' | 'Card' | 'Credit';
  status: 'Received' | 'Pending' | 'Cancelled';
  created_by: string;
  created_at: string;
}

export interface PurchaseItem {
  purchase_item_id: string;
  purchase_id: string;
  product_id: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity: number;
  free_quantity: number;
  purchase_price: number;
  sale_price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Sale {
  sale_id: string;
  invoice_number: string;
  customer_id: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid_amount: number;
  remaining_amount: number;
  payment_method: 'Cash' | 'Bank' | 'Card' | 'JazzCash' | 'Easypaisa' | 'Other';
  sale_type: 'Retail' | 'Wholesale' | 'Prescription';
  status: 'Completed' | 'Refunded' | 'Cancelled';
  created_by: string;
  created_at: string;
}

export interface SaleItem {
  sale_item_id: string;
  sale_id: string;
  product_id: string;
  batch_id: string;
  quantity: number;
  sale_price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface ReturnRecord {
  return_id: string;
  return_number: string;
  original_invoice_id: string;
  customer_id: string;
  return_date: string;
  reason: string;
  total: number;
  refund_amount: number;
  created_by: string;
  created_at: string;
}

export interface Expense {
  expense_id: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  employee_id: string;
  notes: string;
  created_at: string;
}

export interface Payment {
  payment_id: string;
  reference_type: 'Sale' | 'Purchase' | 'Expense' | 'Customer_Adjustment' | 'Supplier_Adjustment';
  reference_id: string;
  party_type: 'Customer' | 'Supplier' | 'Internal';
  party_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string;
  created_by: string;
}

export interface StockAdjustment {
  adjustment_id: string;
  product_id: string;
  batch_id: string;
  adjustment_type: 'Damage' | 'Expired' | 'Theft' | 'Inventory_Audit' | 'Correction';
  quantity: number;
  reason: string;
  reference: string;
  created_by: string;
  created_at: string;
}

export interface Employee {
  employee_id: string;
  employee_code: string;
  name: string;
  cnic: string;
  phone: string;
  email: string;
  designation: string;
  department: string;
  joining_date: string;
  salary: number;
  status: 'Active' | 'Inactive';
  created_at: string;
}

export interface AuditLog {
  log_id: string;
  user_id: string;
  action: string;
  module: string;
  record_id: string;
  old_value: string;
  new_value: string;
  timestamp: string;
}

export interface SheetStatusItem {
  name: string;
  exists: boolean;
  rowCount: number;
  expectedColumns: string[];
}

export interface ConnectionStatus {
  configured: boolean;
  connected: boolean;
  serviceAccountEmail: string;
  spreadsheetId: string;
  spreadsheetTitle?: string;
  mode: 'production' | 'demo-preview';
  errorMessage?: string;
  sheets: SheetStatusItem[];
  missingSheetsCount: number;
  lastChecked: string;
}

export interface DashboardMetrics {
  sales: {
    todaySales: number;
    todayInvoices: number;
    avgInvoiceValue: number;
    trendVsYesterday: number;
  };
  inventory: {
    totalProducts: number;
    totalStockUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  expiry: {
    expiredCount: number;
    expiring30Days: number;
    expiring60Days: number;
    expiring90Days: number;
  };
  financial: {
    todayRevenue: number;
    todayExpenses: number;
    estimatedGrossProfit: number;
    customerReceivables: number;
    supplierPayables: number;
  };
  charts: {
    dailySales: { date: string; amount: number; invoices: number }[];
    topProducts: { name: string; quantity: number; amount: number }[];
    categorySales: { category: string; amount: number; percentage: number }[];
  };
  recentLogs: AuditLog[];
}
