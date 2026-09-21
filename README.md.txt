# 💊 Pharmacy ERP

A modern Pharmacy Management and ERP System designed for small and medium-sized pharmacies.

This system is designed to manage pharmacy operations including medicines, inventory, customers, suppliers, purchases, sales, invoices, payments, employees, reports, and company information.

The application uses Google Sheets as the primary database and Google Cloud Service Account authentication for secure server-side communication with the Google Sheets API.

---

## 🚀 Project Overview

Pharmacy ERP is a complete pharmacy management solution focused on making daily pharmacy operations easier, faster, and more organized.

The system provides a centralized platform for managing:

- 💊 Medicines
- 📦 Inventory
- 🔢 Medicine batches
- ⏰ Expiry dates
- 🧾 Sales
- 🛒 Purchases
- 👥 Customers
- 🚚 Suppliers
- 💰 Payments
- 💸 Expenses
- 👨‍💼 Employees
- 👤 Users and roles
- 📊 Reports
- 🏢 Company information

---

## ✨ Features

### 📊 Dashboard

The dashboard provides an overview of the pharmacy's daily operations.

It includes:

- Today's sales
- Number of invoices
- Total products
- Low-stock products
- Out-of-stock products
- Expired medicines
- Near-expiry medicines
- Customer receivables
- Supplier payables
- Revenue
- Expenses
- Sales analytics

---

### 🧾 Point of Sale (POS)

The POS system allows pharmacy employees to quickly process sales.

Features include:

- Medicine search
- Barcode search
- Barcode scanner support
- Customer selection
- Quantity management
- Discounts
- Tax calculation
- Multiple payment methods
- Invoice generation
- Stock deduction
- Sales history

Supported payment methods include:

- Cash
- Bank
- Card
- JazzCash
- Easypaisa
- Other

---

### 📦 Inventory Management

The inventory system manages pharmacy stock at the product and batch level.

Features include:

- Stock tracking
- Batch tracking
- Purchase price
- Sale price
- Supplier information
- Stock adjustments
- Low-stock alerts
- Out-of-stock alerts
- Expiry tracking
- Stock valuation

---

### 💊 Batch & FEFO Management

Medicines can have multiple batches.

The system uses **FEFO (First Expiry, First Out)** logic to prioritize medicines with the earliest valid expiry date.

For example:

If a medicine has:

- Batch A → 5 units → expires earlier
- Batch B → 20 units → expires later

and a customer purchases 8 units, the system can use:

- 5 units from Batch A
- 3 units from Batch B

Expired batches are not available for normal sales.

---

### ⏰ Expiry Management

The system provides expiry monitoring for medicines.

It can identify:

- Expired medicines
- Medicines expiring within 30 days
- Medicines expiring within 60 days
- Medicines expiring within 90 days

Expiry warning periods can be configured in system settings.

---

### 🛒 Purchase Management

Manage purchases from pharmaceutical suppliers.

Purchase workflow:

Supplier  
→ Purchase Invoice  
→ Products  
→ Batch  
→ Expiry  
→ Quantity  
→ Price  
→ Tax  
→ Payment  
→ Inventory Update

When a purchase is completed, inventory and supplier balances are updated.

---

### 💰 Sales Management

Sales workflow:

Customer  
→ Products  
→ Batch  
→ Quantity  
→ Discount  
→ Tax  
→ Payment  
→ Invoice  
→ Inventory Update

The system records each transaction and updates the appropriate stock and customer balances.

---

### ↩️ Sales Returns

The system supports sales returns using the original invoice.

Users can view:

- Original invoice
- Customer
- Products
- Original quantity
- Already returned quantity
- Remaining returnable quantity

The system prevents users from returning more items than were originally sold.

---

### 👥 Customer Management

Customer profiles can contain:

- Customer information
- Phone number
- Address
- Purchase history
- Total purchases
- Outstanding balance
- Payment history
- Credit limit
- Last purchase

Customer statements can also be generated.

---

### 🚚 Supplier Management

Supplier profiles include:

- Supplier information
- Contact details
- Purchase history
- Outstanding balance
- Payment history
- Total purchases

Supplier statements can also be generated.

---

### 👨‍💼 Employee Management

Manage pharmacy employees with information such as:

- Employee ID
- Name
- CNIC
- Phone
- Email
- Designation
- Department
- Joining date
- Salary
- Status

---

### 👤 User Roles & Permissions

The system supports role-based access control.

Example roles:

- Owner
- Administrator
- Manager
- Pharmacist
- Cashier
- Inventory Manager
- Accountant

Permissions can be customized according to the user's role.

---

### 📊 Reports

The reporting system provides information about pharmacy operations.

#### Sales Reports

- Daily sales
- Weekly sales
- Monthly sales
- Custom date range
- Sales by product
- Sales by category
- Sales by employee
- Sales by customer

#### Purchase Reports

- Purchase history
- Supplier purchases
- Product purchases

#### Inventory Reports

- Current stock
- Low stock
- Out of stock
- Expired stock
- Near-expiry stock
- Stock valuation
- Batch reports

#### Financial Reports

- Revenue
- Expenses
- Estimated profit
- Customer receivables
- Supplier payables
- Cash flow

---

## 🇵🇰 Pakistan-Focused Features

The system is designed with Pakistani pharmacy businesses in mind.

It supports configuration for:

- PKR currency
- CNIC
- NTN
- STRN
- Pakistani phone numbers
- Pakistani cities
- Provinces
- Cash
- Bank
- Card
- JazzCash
- Easypaisa

Tax rates are configurable rather than permanently hard-coded.

---

## ☁️ Google Sheets Database

Google Sheets is used as the primary database for this project.

The application communicates with Google Sheets through the Google Sheets API.

### Architecture

```text
                 Pharmacy ERP
                      │
                      ▼
                React Frontend
                      │
                      ▼
                 Backend API
                      │
                      ▼
          Google Sheets Service Layer
                      │
                      ▼
             Google Sheets API
                      │
                      ▼
              Google Spreadsheet