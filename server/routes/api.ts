/**
 * API Router for Pharmacy ERP
 */

import { Router } from 'express';
import { googleSheetsService } from '../googleSheets.js';
import { DEMO_USERS, DEMO_ROLES } from '../demoData.js';

const router = Router();

// Current active session state for role switching and testing
let activeUser = {
  ...DEMO_USERS[0],
};

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'PharmaPulse ERP Core API',
  });
});

/**
 * Google Sheets connection & worksheet status
 */
router.get('/status', async (req, res) => {
  try {
    const status = await googleSheetsService.verifyConnection();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      error: err.message,
    });
  }
});

/**
 * Initialize worksheets and headers in Google Sheet
 */
router.post('/init-sheets', async (req, res) => {
  try {
    const result = await googleSheetsService.initializeWorksheets();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * Populate Google Sheet with Pakistan Pharmacy Demo Data
 */
router.post('/seed-demo', async (req, res) => {
  try {
    const result = await googleSheetsService.seedDemoData();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * Dashboard metrics and analytics
 */
router.get('/dashboard', async (req, res) => {
  try {
    const metrics = await googleSheetsService.getDashboardMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({
      error: err.message,
    });
  }
});

/**
 * Auth Me
 */
router.get('/auth/me', (req, res) => {
  const roleObj = DEMO_ROLES.find((r) => r.role_name === activeUser.role);
  res.json({
    user: activeUser,
    role: roleObj || DEMO_ROLES[0],
    availableRoles: DEMO_ROLES,
  });
});

/**
 * Switch Active User Role (for role testing in Phase 1)
 */
router.post('/auth/switch-role', (req, res) => {
  const { role } = req.body;
  const targetRole = DEMO_ROLES.find((r) => r.role_name === role);

  if (!targetRole) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  activeUser = {
    ...activeUser,
    role: targetRole.role_name as any,
  };

  res.json({
    success: true,
    user: activeUser,
    role: targetRole,
  });
});

// ==========================================
// PHASE 2: PRODUCTS API
// ==========================================

router.get('/products', async (req, res) => {
  try {
    const { search, category, status, dosage_form } = req.query;
    const products = await googleSheetsService.getProducts({
      search: search ? String(search) : undefined,
      category: category ? String(category) : undefined,
      status: status ? String(status) : undefined,
      dosage_form: dosage_form ? String(dosage_form) : undefined,
    });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const product = await googleSheetsService.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const product = await googleSheetsService.createProduct(req.body, activeUser.name);
    res.status(201).json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const updated = await googleSheetsService.updateProduct(req.params.id, req.body, activeUser.name);
    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const result = await googleSheetsService.deleteProduct(req.params.id, activeUser.name);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PHASE 2: CATEGORIES API
// ==========================================

router.get('/categories', async (req, res) => {
  try {
    const categories = await googleSheetsService.getCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const category = await googleSheetsService.createCategory(req.body, activeUser.name);
    res.status(201).json({ success: true, category });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const result = await googleSheetsService.updateCategory(req.params.id, req.body, activeUser.name);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const result = await googleSheetsService.deleteCategory(req.params.id, activeUser.name);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PHASE 2: BATCHES API
// ==========================================

router.get('/batches', async (req, res) => {
  try {
    const { product_id, supplier_id, expiry_status } = req.query;
    const batches = await googleSheetsService.getBatches({
      product_id: product_id ? String(product_id) : undefined,
      supplier_id: supplier_id ? String(supplier_id) : undefined,
      expiry_status: expiry_status ? String(expiry_status) : undefined,
    });
    res.json(batches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/batches', async (req, res) => {
  try {
    const batch = await googleSheetsService.createBatch(req.body, activeUser.name);
    res.status(201).json({ success: true, batch });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PHASE 2: INVENTORY & FEFO CALCULATION ENGINE
// ==========================================

router.get('/inventory/summary', async (req, res) => {
  try {
    const summary = await googleSheetsService.getInventorySummary();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory/adjust', async (req, res) => {
  try {
    const { product_id, batch_id, adjustment_type, quantity, reason, reference } = req.body;
    if (!product_id || !batch_id || !adjustment_type || quantity === undefined) {
      return res.status(400).json({ error: 'Missing required adjustment parameters' });
    }

    const result = await googleSheetsService.recordStockAdjustment({
      product_id,
      batch_id,
      adjustment_type,
      quantity: Number(quantity),
      reason: reason || 'Manual Stock Adjustment',
      reference,
      user: activeUser.name,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory/simulate-fefo', async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id || !quantity) {
      return res.status(400).json({ error: 'Product ID and requested quantity are required.' });
    }

    const simulation = await googleSheetsService.simulateFEFODispense(product_id, Number(quantity));
    res.json(simulation);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory/apply-fefo-dispense', async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id || !quantity) {
      return res.status(400).json({ error: 'Product ID and requested quantity are required.' });
    }

    const result = await googleSheetsService.applyFEFODispense(product_id, Number(quantity), activeUser.name);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// AUTO-INITIALIZATION API
// ==========================================

router.post('/auto-init', async (req, res) => {
  try {
    const result = await googleSheetsService.autoInitializeAllSheets();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SUPPLIERS API
// ==========================================

router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await googleSheetsService.getSuppliers();
    res.json(suppliers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const supplier = await googleSheetsService.createSupplier(req.body, activeUser.name);
    res.status(201).json({ success: true, supplier });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/suppliers/:id', async (req, res) => {
  try {
    const updated = await googleSheetsService.updateSupplier(req.params.id, req.body, activeUser.name);
    res.json({ success: true, supplier: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  try {
    const result = await googleSheetsService.deleteSupplier(req.params.id, activeUser.name);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/suppliers/:id/statement', async (req, res) => {
  try {
    const statement = await googleSheetsService.getSupplierStatement(req.params.id);
    res.json(statement);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// CUSTOMERS / PATIENTS API
// ==========================================

router.get('/customers', async (req, res) => {
  try {
    const customers = await googleSheetsService.getCustomers();
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/customers/:id/statement', async (req, res) => {
  try {
    const statement = await googleSheetsService.getCustomerStatement(req.params.id);
    res.json(statement);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const customer = await googleSheetsService.createCustomer(req.body, activeUser.name);
    res.status(201).json({ success: true, customer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const updated = await googleSheetsService.updateCustomer(req.params.id, req.body, activeUser.name);
    res.json({ success: true, customer: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    const result = await googleSheetsService.deleteCustomer(req.params.id, activeUser.name);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// EMPLOYEES API
// ==========================================

router.get('/employees', async (req, res) => {
  try {
    const employees = await googleSheetsService.getEmployees();
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/employees', async (req, res) => {
  try {
    const employee = await googleSheetsService.createEmployee(req.body, activeUser.name);
    res.status(201).json({ success: true, employee });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/employees/:id', async (req, res) => {
  try {
    const updated = await googleSheetsService.updateEmployee(req.params.id, req.body, activeUser.name);
    res.json({ success: true, employee: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/employees/:id', async (req, res) => {
  try {
    const result = await googleSheetsService.deleteEmployee(req.params.id, activeUser.name);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PHASE 6: USERS & ROLES API
// ==========================================

router.get('/users', async (req, res) => {
  try {
    const users = await googleSheetsService.getUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const user = await googleSheetsService.createUser(req.body, activeUser.name);
    res.status(201).json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const updated = await googleSheetsService.updateUser(req.params.id, req.body, activeUser.name);
    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const result = await googleSheetsService.deleteUser(req.params.id, activeUser.name);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/roles', async (req, res) => {
  try {
    const roles = await googleSheetsService.getRoles();
    res.json(roles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/roles/:id', async (req, res) => {
  try {
    const { permissions } = req.body;
    const updated = await googleSheetsService.updateRolePermissions(req.params.id, permissions, activeUser.name);
    res.json({ success: true, role: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// EXPENSES API
// ==========================================

router.get('/expenses', async (req, res) => {
  try {
    const expenses = await googleSheetsService.getExpenses();
    res.json(expenses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/expenses', async (req, res) => {
  try {
    const expense = await googleSheetsService.createExpense(req.body, activeUser.name);
    res.status(201).json({ success: true, expense });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/expenses/:id', async (req, res) => {
  try {
    const result = await googleSheetsService.deleteExpense(req.params.id, activeUser.name);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// PAYMENTS API
// ==========================================

router.get('/payments', async (req, res) => {
  try {
    const payments = await googleSheetsService.getPayments();
    res.json(payments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payments', async (req, res) => {
  try {
    const payment = await googleSheetsService.createPayment(req.body, activeUser.name);
    res.status(201).json({ success: true, payment });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// COMPANY SETTINGS API
// ==========================================

router.get('/company', async (req, res) => {
  try {
    const company = await googleSheetsService.getCompany();
    res.json(company);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/company', async (req, res) => {
  try {
    const updated = await googleSheetsService.updateCompany(req.body, activeUser.name);
    res.json({ success: true, company: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// SALES & POS CHECKOUT API
// ==========================================

router.get('/sales', async (req, res) => {
  try {
    const sales = await googleSheetsService.getSales();
    res.json(sales);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sales/:id', async (req, res) => {
  try {
    const details = await googleSheetsService.getSaleById(req.params.id);
    res.json(details);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pos/checkout', async (req, res) => {
  try {
    const result = await googleSheetsService.checkout(req.body, activeUser.name);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/sales/return', async (req, res) => {
  try {
    const result = await googleSheetsService.processSaleReturn(req.body, activeUser.name);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// PURCHASES & STOCK RECEIVING API
// ==========================================

router.get('/purchases', async (req, res) => {
  try {
    const purchases = await googleSheetsService.getPurchases();
    res.json(purchases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/purchases/:id', async (req, res) => {
  try {
    const details = await googleSheetsService.getPurchaseById(req.params.id);
    res.json(details);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/purchases', async (req, res) => {
  try {
    const result = await googleSheetsService.createPurchase(req.body, activeUser.name);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// AUDIT LOGS & REPORTS API
// ==========================================

router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await googleSheetsService.getAuditLogs();
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/summary', async (req, res) => {
  try {
    const summary = await googleSheetsService.getReportsSummary();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

