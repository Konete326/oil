import { Customer } from "../models/customerModel.js";
import { Supplier } from "../models/supplierModel.js";
import { Product } from "../models/productModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { PosSale } from "../models/posSaleModel.js";
import { Purchase } from "../models/purchaseModel.js";
import { Ledger } from "../models/ledgerModel.js";
import { SupplierLedger } from "../models/supplierLedgerModel.js";
import { connectDB } from "../config/db.js";

export const getTrialBalance = async (req, res, next) => {
  try {
    await connectDB();
    const [customers, suppliers, products, cashPaid, cashRec, posSales, purchases] = await Promise.all([
      Customer.find(),
      Supplier.find(),
      Product.find(),
      CashTransaction.find({ type: "Paid" }),
      CashTransaction.find({ type: "Received" }),
      PosSale.find(),
      Purchase.find(),
    ]);

    const totalCustomerReceivables = customers.reduce((sum, c) => sum + Math.max(c.currentBalance || 0, 0), 0);
    const totalSupplierPayables = suppliers.reduce((sum, s) => sum + Math.max(s.currentBalance || 0, 0), 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.stockQuantity || 0) * (p.costPrice || 0), 0);

    const totalCashPaidOut = cashPaid.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalCashReceivedIn = cashRec.reduce((sum, c) => sum + (c.amount || 0), 0);
    const netCashOnHand = Math.max(totalCashReceivedIn - totalCashPaidOut, 0);

    const totalSalesIncome = posSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const totalStockPurchases = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalOperatingExpenses = totalCashPaidOut;

    const accounts = [
      { code: "1010", accountName: "Cash on Hand Account", category: "Asset", debit: netCashOnHand, credit: 0 },
      { code: "1020", accountName: "Customer Receivables (Khata)", category: "Asset", debit: totalCustomerReceivables, credit: 0 },
      { code: "1030", accountName: "Inventory Stock Asset Value", category: "Asset", debit: totalInventoryValue, credit: 0 },
      { code: "2010", accountName: "Supplier Payables (Khareedari Khata)", category: "Liability", debit: 0, credit: totalSupplierPayables },
      { code: "4010", accountName: "Sales Revenue Income", category: "Revenue", debit: 0, credit: totalSalesIncome },
      { code: "5010", accountName: "Stock Purchases Cost", category: "Expense", debit: totalStockPurchases, credit: 0 },
      { code: "5020", accountName: "Operating Expenses Outflow", category: "Expense", debit: totalOperatingExpenses, credit: 0 },
    ];

    const totalDebit = accounts.reduce((sum, a) => sum + a.debit, 0);
    const totalCredit = accounts.reduce((sum, a) => sum + a.credit, 0);

    const suppliersTrial = suppliers.map((s, idx) => {
      const pAmt = purchases.filter((p) => p.supplierName?.toLowerCase() === s.name?.toLowerCase()).reduce((sum, p) => sum + (p.totalAmount || 0), 0);
      const paid = Math.max(0, pAmt - (s.currentBalance || 0));
      return { _id: s._id, code: `SUP-${101 + idx}`, name: s.name, phone: s.phone || "", address: s.address || "", totalPurchases: pAmt, totalPaid: paid, currentBalance: s.currentBalance || 0, debit: paid, credit: pAmt };
    });

    const customersTrial = customers.map((c, idx) => {
      const cSales = posSales.filter((s) => s.customerName?.toLowerCase() === c.name?.toLowerCase()).reduce((sum, s) => sum + (s.grandTotal || 0), 0);
      const paid = Math.max(0, cSales - (c.currentBalance || 0));
      return { _id: c._id, code: `CUST-${101 + idx}`, name: c.name, phone: c.phone || "", city: c.city || "", customerType: c.customerType || "Retail", totalSales: cSales, totalPaid: paid, currentBalance: c.currentBalance || 0, debit: cSales, credit: paid };
    });

    res.status(200).json({
      success: true,
      summary: { totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 1 },
      data: accounts,
      suppliersTrial,
      customersTrial,
    });
  } catch (error) {
    next(error);
  }
};

export const getDetailedPartyLedger = async (req, res, next) => {
  try {
    await connectDB();
    const { partyName, partyType, startDate, endDate } = req.query;
    if (!partyName) {
      res.status(400); throw new Error("Party name is required.");
    }

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const isSupplier = partyType === "Supplier";
    const entries = isSupplier
      ? await SupplierLedger.find({ supplierName: partyName, ...dateFilter }).sort({ createdAt: 1 })
      : await Ledger.find({ clientName: partyName, ...dateFilter }).sort({ createdAt: 1 });

    const history = entries.map((e) => ({
      _id: e._id,
      date: e.createdAt,
      type: e.transactionType,
      debit: e.transactionType.includes(isSupplier ? "Payment" : "Debit") ? e.amount : 0,
      credit: e.transactionType.includes(isSupplier ? "Purchase" : "Credit") ? e.amount : 0,
      runningBalance: e.runningBalance,
      mode: e.paymentMode,
      reference: e.referenceNumber,
      notes: e.notes,
    }));

    res.status(200).json({ success: true, partyName, partyType, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};
