# Al Khaleej Lubricants & Mill Management ERP System
## Comprehensive Project Analysis & Functional Specification Report

---

### Executive Summary

The **Al Khaleej Lubricants Management System** is a full-stack, enterprise-grade ERP, POS, and financial accounting platform built specifically for lubricant manufacturers, distributors, retail outlets, and bulk textile mill suppliers. 

The application is built on a modern MERN stack architecture:
- **Backend:** Node.js, Express.js (modular micro-controller structure), MongoDB (Mongoose ORM), JWT Authentication, Helmet security, Morgan logging.
- **Frontend:** React 19, Vite, Tailwind CSS v4, Radix UI component primitives, Lucide Icons, Sonner Notifications, Agentation, and native HTML5 print & canvas barcode generation engines.
- **Localization & Offline:** Dual-language engine (English LTR and Urdu Nastaliq RTL) with real-time DOM translation, paired with an IndexedDB-based offline store and background synchronization.

---

### 1. Core Services Provided by the System

1. **Lubricants & Mill Supply Chain Management:**
   - Dedicated dispatch tracking for textile and industrial mills.
   - Dip-measurement in inches for tanker trucks, driver logs, vehicle registration, and gate pass management.
2. **Dual-Channel Sales & POS Billing Service:**
   - High-speed retail counter POS with barcode lookups, unit conversion (Liters, Cans, Drums), quick discounts, and thermal/A4 printing.
   - Wholesale and institutional billing for bulk consignees.
3. **Real-time Inventory & Stock Control Service:**
   - SKU, oil viscosity (e.g., 20W-50, SAE-40), API grade, packaging type classification.
   - Automated low-stock thresholds with real-time system alerts.
   - Barcode sticker generation for drums, cans, and retail bottles.
4. **Double-Entry Khata & Ledger Management Service:**
   - Mill and general customer ledgers with running balance calculations.
   - Supplier purchase ledgers tracking payables, bill references, and payment terms.
5. **Daily Cash Register & Petty Cash Service (Daily Rokarh):**
   - Independent cash in and cash out ledger.
   - Daily opening balance, cash received, cash paid, and net closing drawer cash balance.
6. **Operating Expense Tracking Service:**
   - Categorized tracking of operational overheads (salaries, transport, rent, utilities, maintenance, official fees).
7. **Staff Payroll & Advance Management Service:**
   - Employee profiles, monthly payroll processing, salary slip generation, and automatic deduction of salary advances.
8. **Comprehensive Financial Reporting & Business Intelligence:**
   - Real-time Gross Profit, Operating Expenses, Net Profit, and Margin percentages across customizable timeframes (Daily, Weekly, Monthly, Custom Range).
   - Standardized Trial Balance sheet verifying debit-credit balance.
   - Excel export for financial reconciliation and external tax auditing.
9. **System Auditing & Access Control:**
   - Role-Based Access Control (Super Admin, Manager, Cashier).
   - Immutable audit trail capturing every sensitive action (sales cancellations, stock adjustments, ledger modifications).
   - Multi-layer security PIN / Admin password verification for destructive operations.

---

### 2. Complete Module & Feature Matrix

| Module | Purpose & Features | Relevant Routes & Files |
| :--- | :--- | :--- |
| **Dashboard** | Executive KPI cards (Total Sales, Net Cash, Stock Value, Receivables), recent invoices, net revenue charts, channel sales breakdown, activity logs. | `dashboard.jsx`, `dashboardController.js` |
| **POS Terminal** | Real-time product search, SKU scanning, quantity adjustments, retail vs. wholesale rate toggle, payment method selection, instant A4 & thermal print, WhatsApp dispatch. | `pos-counter.jsx`, `posController.js` |
| **POS History & Audit** | Historical bill log, search by customer or bill number, admin-only sale deletion with mandatory reason logging and automatic inventory replenishment. | `pos-history.jsx`, `pos-delete-reason-modal.jsx` |
| **Textile Mills & Challans** | Mill directory with contract rates, credit limits, delivery challan generation with tanker dip-readings, driver details, and gate-pass generation. | `textile-manager.jsx`, `challanController.js`, `millController.js` |
| **Inventory & Products** | Product catalog, brand/viscosity/grade attributes, packaging types, cost vs. selling prices, minimum stock alert triggers, printable barcode stickers. | `product-manager.jsx`, `product-modal.jsx`, `productController.js` |
| **Categories & Subcategories** | Hierarchical grouping of lubricants, base oils, greases, synthetic vs. mineral grades. | `category-manager.jsx`, `categoryController.js` |
| **Customer Directory & Khata** | Customer profiles, credit limits, phone/NTN, total debit/credit records, payment collection modals, and printable ledger statements. | `customer-manager.jsx`, `customerController.js` |
| **Mill & Client Ledgers** | Double-entry running balance tracking for mills and corporate buyers, recording deliveries, bank receipts, and cheques. | `ledger-manager.jsx`, `ledgerController.js` |
| **Supplier Accounts & Purchases** | Raw material / packaged lubricant supplier accounts, procurement logs, purchase invoices, and payable balances. | `supplier-ledger-manager.jsx`, `purchaseController.js`, `supplierController.js` |
| **Daily Cash Book (Rokarh)** | Day-to-day cash drawer tracking, categorized cash in/out entries, party references, and daily cash-in-hand statement printing. | `cash-manager.jsx`, `cashController.js` |
| **Operating Expenses** | Factory and outlet overhead tracking by department, receipt voucher generation, and expense trend reporting. | `expenses-manager.jsx`, `expenseController.js` |
| **Payroll & Advances** | Employee records, designations, base salaries, advance payouts, monthly salary voucher issuance, and payslip generation. | `employee-payroll-manager.jsx`, `salaryController.js` |
| **Profit & Loss Analytics** | Consolidated income statement deducting inventory procurement cost and operating cash outflow from gross revenue to determine net margins. | `profit-loss-widget.jsx`, `profitLossController.js` |
| **Trial Balance & Reports** | Debit/Credit balance verification across assets, liabilities, equity, revenues, and expenses. Party-wise ledger drilldown and Excel exports. | `financial-reports-manager.jsx`, `financialReportController.js` |
| **Sales & Purchases Reconciler** | Periodical sales vs. purchases cross-matching, party-wise turnover history, and printable A4 reconciliation sheets. | `sales-purchase-manager.jsx`, `salesReportController.js` |
| **Security & User Management** | User credential management, role assignment, admin override passwords, session security, and JWT refresh cycles. | `user-management-manager.jsx`, `userController.js` |
| **System Logs & Audit Trail** | Timestamped action logging, system telemetry, and audit filters for compliance and forensic tracking. | `audit-trail-manager.jsx`, `systemLogController.js` |
| **Data Maintenance & Backup** | Controlled data reset with password confirmation, offline sync queue viewer, and local hydration sync. | `data-maintenance-tab.jsx`, `dataResetController.js`, `syncController.js` |

---

### 3. User Tasks & Operational Workflows

#### A. Stock & Inventory Tasks
- Add new lubricant products with grade, viscosity, SKU, packaging type, cost price, and retail price.
- Print standard barcode labels/stickers in customizable grid layouts for bottles, cans, and drums.
- Monitor low stock notifications triggered when items drop below `minStockAlert`.
- Automatically deduct stock on POS checkout and mill challan creation.
- Restore stock levels automatically when an admin deletes or cancels a POS invoice.

#### B. Sales & Revenue Tasks
- Execute fast counter sales for walk-in retail customers.
- Execute wholesale sales with volume discounts and customizable payment options (Cash, Card, Bank Transfer, Khata).
- Dispatch bulk tanker lubricants to textile mills with recorded dip measurements and vehicle details.
- Filter, search, and reprint sales records from POS History.
- Export sales reports to Excel by daily, weekly, or monthly periods.

#### C. Profit, Loss & Financial Analytics Tasks
- Track Gross Profit: Calculated as Total Sales (POS + Mill Challans) minus Total Stock Purchases.
- Track Net Profit: Calculated as Gross Profit minus Operating Expenses & Cash Outflows.
- Calculate Profit Margin Percentage in real time across any date range.
- Generate and audit the Trial Balance Sheet to ensure system-wide debits equal credits.
- Review party-wise sales history to identify highest-performing clients and mills.

#### D. Credit & Khata (Ledgers) Tasks
- Record payments received from customers via cash, online bank transfer, or cheque.
- Set credit limits for mills and customers to prevent over-exposure.
- Record stock purchases from raw lubricant suppliers and track pending liabilities.
- Print official customer and supplier ledger statements for audit and payment follow-ups.

#### E. Cashier & Operational Tasks
- Open and balance the daily cash drawer (Cash In vs. Cash Out).
- Record petty cash expenses (fuel, refreshments, generator diesel, plant repairs).
- Disburse salary advances to employees and deduct them automatically during month-end payroll.
- Issue salary slips with itemized allowances and advance deductions.

---

### 4. Invoices, Challans & Printable Documents Generated

The system generates 12 distinct professional, print-ready documents and digital shareable formats:

1. **A4 Proforma & Commercial Sales Invoice:**
   - Generated from POS Counter and POS History.
   - Includes NTN, STRN, Bank account details, HS Code (`2710.19.31`), Chamber of Commerce formatting, itemized pricing, subtotal, discount, grand total, and PKR Amount in Words.
2. **Retail POS Thermal Receipt (58mm / 80mm):**
   - High-speed compact receipt for POS thermal printers.
   - Displays receipt number, date, cashier name, item list, total amount, cash received, and change return.
3. **Delivery Challan & Gate Pass (A4 Standard):**
   - Generated in the Textile & Mill Management module.
   - Contains Mill Name, Tanker Vehicle Number, Driver Name & Phone, Dip Measurement in Inches, Delivered Liters, Contract Rate, and Total Amount with Gate Outward authorization signatures.
4. **Customer Ledger Statement (Khata Statement):**
   - Generated from Customer Manager & Ledgers.
   - Detailed ledger report showing opening balance, debit entries (invoices/challans), credit entries (payments), running balance, and payment mode breakdown.
5. **Supplier Purchase Ledger Statement:**
   - Generated from Supplier Ledgers.
   - Tracks purchases, supplier invoices, payment vouchers, and net payable balances.
6. **Daily Cash Register Statement (Cash Book Sheet):**
   - Generated from Cash Manager.
   - Summarizes daily cash collections, cash disbursements, net drawer balance, and reference notes.
7. **Operating Expense Voucher Statement:**
   - Generated from Expenses Manager.
   - Formal payment voucher listing expense title, department category, voucher number, payment mode, and authorized signatures.
8. **Employee Monthly Salary Slip (Payslip Voucher):**
   - Generated from Payroll Manager.
   - Displays Employee Name, Month/Year, Base Salary, Overtime/Bonuses, Advance Deductions, Net Salary Paid, and acknowledgment signature lines.
9. **Profit & Loss Income Statement (Maliyaati Report):**
   - Generated from Financial Reports & P&L Widget.
   - Standard income statement detailing Revenue (POS + Challans), Cost of Goods Sold (Procurement), Gross Profit, Operating Overhead, Net Profit, and Margin Percentage.
10. **Trial Balance Sheet (A4 Print):**
    - Generated from Financial Reports Manager.
    - Full chart of accounts trial balance with Asset, Liability, Revenue, and Expense categorization and debit/credit balance verification.
11. **Sales & Purchases Reconciliation Statement:**
    - Generated from Sales & Purchases Manager.
    - Side-by-side reconciliation of total inward stock procurement vs. outward sales turnover.
12. **Barcode Labels & SKU Sticker Sheet:**
    - Generated from Product Manager.
    - Printable multi-grid barcode stickers with product name, SKU, price, and barcode visual for bottles, cans, and oil drums.
13. **Direct WhatsApp Digital Invoice / Gate Pass:**
    - Embedded 1-click WhatsApp web API sharing for invoices and delivery challans, formatting all details cleanly into WhatsApp message markdown.

---

### 5. Identified Codebase Issues & Immediate Troubleshooting Fixes

During the codebase analysis, the following issues were identified:

#### Issue 1: `p.price` Field Mismatch in Trial Balance Valuation
- **File:** `backend/src/controllers/financialReportController.js` (Line 28)
- **Problem:** The calculation uses `(p.price || 0)`:
  ```javascript
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stockQuantity || 0) * (p.price || 0), 0);
  ```
  However, `productModel.js` defines `costPrice` and `sellingPrice`, not `price`. As a result, `totalInventoryValue` evaluates to `0`, distorting the Asset side of the Trial Balance.
- **Immediate Fix:** Update line 28 to use `(p.costPrice || p.sellingPrice || 0)`.

#### Issue 2: Credit Sales in POS Not Automatically Linked to Customer Khata
- **File:** `backend/src/controllers/posController.js`
- **Problem:** When a POS sale is made with `paymentMode === "Credit / Khata"`, it saves the record in `PosSale`, but does not automatically create a debit entry in `Customer` or `Ledger`.
- **Immediate Fix:** In `createPosSale`, check if `paymentMode === "Credit / Khata"` and automatically create a `Ledger` debit entry and increment `customer.currentBalance`.

#### Issue 3: Missing Database Transaction on Bulk POS Checkout
- **File:** `backend/src/controllers/posController.js`
- **Problem:** Multiple items have their stock decremented sequentially in a `for` loop. If an error occurs midway, previous items remain decremented without rolling back.
- **Immediate Fix:** Wrap the stock decrement and sale creation inside a MongoDB session transaction (`mongoose.startSession()`).

---

### 6. Proactive Feature Recommendations & Roadmap

1. **Hardware Barcode Scanner Listener:** Add a global `keydown` event listener in the POS view to detect high-speed USB/Bluetooth barcode scanner inputs and auto-add items to the cart without manual keyboard typing.
2. **Automated WhatsApp Payment Reminders:** Provide a scheduled or 1-click reminder feature that sends due Khata balances to customers with outstanding balances directly to their WhatsApp.
3. **Lubricant Batch & Drum Expiry Tracking:** Add batch numbers, drum serials, and manufacturing dates for industrial greases and synthetic oils to comply with ISO/industrial audits.
4. **Role-based POS Shift Handover:** Add a Shift Closing / Cash Drawer Handover modal where cashiers tally cash-in-hand before handing over to the next shift.
