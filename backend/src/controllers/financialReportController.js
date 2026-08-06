import { Mill } from "../models/millModel.js";
import { Supplier } from "../models/supplierModel.js";
import { Product } from "../models/productModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { PosSale } from "../models/posSaleModel.js";
import { Challan } from "../models/challanModel.js";
import { Purchase } from "../models/purchaseModel.js";
import { Ledger } from "../models/ledgerModel.js";
import { SupplierLedger } from "../models/supplierLedgerModel.js";
import { connectDB } from "../config/db.js";

export const getTrialBalance = async (req, res, next) => {
  try {
    await connectDB();
    const [mills, suppliers, products, cashPaid, cashRec, posSales, challans, purchases] = await Promise.all([
      Mill.find(),
      Supplier.find(),
      Product.find(),
      CashTransaction.find({ type: "Paid" }),
      CashTransaction.find({ type: "Received" }),
      PosSale.find(),
      Challan.find(),
      Purchase.find(),
    ]);

    const totalCustomerReceivables = mills.reduce((sum, m) => sum + Math.max(m.currentBalance || 0, 0), 0);
    const totalSupplierPayables = suppliers.reduce((sum, s) => sum + Math.max(s.currentBalance || 0, 0), 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.stockQuantity || 0) * (p.price || 0), 0);

    const totalCashPaidOut = cashPaid.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalCashReceivedIn = cashRec.reduce((sum, c) => sum + (c.amount || 0), 0);
    const netCashOnHand = Math.max(totalCashReceivedIn - totalCashPaidOut, 0);

    const posTotal = posSales.reduce((sum, s) => sum + (s.grandTotal || 0), 0);
    const challanTotal = challans.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const totalSalesIncome = posTotal + challanTotal;

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

    res.status(200).json({
      success: true,
      summary: { totalDebit, totalCredit, isBalanced: Math.abs(totalDebit - totalCredit) < 1 },
      data: accounts,
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
      res.status(400);
      throw new Error("Party name is required.");
    }

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let history = [];
    if (partyType === "Supplier") {
      const entries = await SupplierLedger.find({ supplierName: partyName, ...dateFilter }).sort({ createdAt: 1 });
      history = entries.map((e) => ({
        _id: e._id,
        date: e.createdAt,
        type: e.transactionType,
        debit: e.transactionType.includes("Payment") ? e.amount : 0,
        credit: e.transactionType.includes("Purchase") ? e.amount : 0,
        runningBalance: e.runningBalance,
        mode: e.paymentMode,
        reference: e.referenceNumber,
        notes: e.notes,
      }));
    } else {
      const entries = await Ledger.find({ clientName: partyName, ...dateFilter }).sort({ createdAt: 1 });
      history = entries.map((e) => ({
        _id: e._id,
        date: e.createdAt,
        type: e.transactionType,
        debit: e.transactionType.includes("Debit") ? e.amount : 0,
        credit: e.transactionType.includes("Credit") ? e.amount : 0,
        runningBalance: e.runningBalance,
        mode: e.paymentMode,
        reference: e.referenceNumber,
        notes: e.notes,
      }));
    }

    res.status(200).json({ success: true, partyName, partyType, count: history.length, data: history });
  } catch (error) {
    next(error);
  }
};
