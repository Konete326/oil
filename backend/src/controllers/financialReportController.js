import { Mill } from "../models/millModel.js";
import { Customer } from "../models/customerModel.js";
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
    const [mills, customers, suppliers, products, cashPaid, cashRec, posSales, challans, purchases] = await Promise.all([
      Mill.find().lean(),
      Customer.find().lean(),
      Supplier.find().lean(),
      Product.find().lean(),
      CashTransaction.find({ type: "Paid" }).lean(),
      CashTransaction.find({ type: "Received" }).lean(),
      PosSale.find().lean(),
      Challan.find().lean(),
      Purchase.find().lean(),
    ]);

    const millReceivables = mills.reduce((sum, m) => sum + Math.max(Number(m.currentBalance) || 0, 0), 0);
    const retailReceivables = customers.reduce((sum, c) => sum + Math.max(Number(c.currentBalance) || 0, 0), 0);
    const totalCustomerReceivables = Number((millReceivables + retailReceivables).toFixed(2));

    const totalSupplierPayables = suppliers.reduce((sum, s) => sum + Math.max(Number(s.currentBalance) || 0, 0), 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + (Number(p.stockQuantity) || 0) * (Number(p.costPrice) || Number(p.sellingPrice) || 0), 0);

    const totalCashPaidOut = cashPaid.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const totalCashReceivedIn = cashRec.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const netCashOnHand = Math.max(totalCashReceivedIn - totalCashPaidOut, 0);

    const posTotal = posSales.reduce((sum, s) => sum + (Number(s.grandTotal) || 0), 0);
    const challanTotal = challans.reduce((sum, c) => sum + (Number(c.totalAmount) || 0), 0);
    const totalSalesIncome = Number((posTotal + challanTotal).toFixed(2));

    const totalStockPurchases = purchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
    const totalOperatingExpenses = totalCashPaidOut;

    const accounts = [
      { code: "1010", accountName: "Cash on Hand Account", category: "Asset", debit: netCashOnHand, credit: 0 },
      { code: "1020", accountName: "Customer & Mill Receivables (Khata)", category: "Asset", debit: totalCustomerReceivables, credit: 0 },
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
