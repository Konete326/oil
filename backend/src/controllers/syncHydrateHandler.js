import { Product } from "../models/productModel.js";
import { Category } from "../models/categoryModel.js";
import { Customer } from "../models/customerModel.js";
import { Supplier } from "../models/supplierModel.js";
import { Mill } from "../models/millModel.js";
import { Expense } from "../models/expenseModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { PosSale } from "../models/posSaleModel.js";
import { Challan } from "../models/challanModel.js";
import { SystemLog } from "../models/systemLogModel.js";
import { Ledger } from "../models/ledgerModel.js";
import { SupplierLedger } from "../models/supplierLedgerModel.js";

export const getHydrateData = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [
      products,
      categories,
      customers,
      suppliers,
      mills,
      expenses,
      cashTransactions,
      posSales,
      challans,
      systemLogs,
      ledgerEntries,
      supplierLedgerEntries,
    ] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).lean(),
      Category.find().sort({ createdAt: -1 }).lean(),
      Customer.find().sort({ createdAt: -1 }).lean(),
      Supplier.find().sort({ createdAt: -1 }).lean(),
      Mill.find().sort({ createdAt: -1 }).lean(),
      Expense.find().sort({ date: -1, createdAt: -1 }).limit(200).lean(),
      CashTransaction.find().sort({ date: -1, createdAt: -1 }).limit(200).lean(),
      PosSale.find().sort({ createdAt: -1 }).limit(200).lean(),
      Challan.find().sort({ createdAt: -1 }).limit(200).lean(),
      SystemLog.find({ createdAt: { $gte: sevenDaysAgo } }).sort({ createdAt: -1 }).limit(200).lean(),
      Ledger.find().sort({ createdAt: -1 }).limit(300).lean(),
      SupplierLedger.find().sort({ createdAt: -1 }).limit(300).lean(),
    ]);

    res.status(200).json({
      success: true,
      timestamp: new Date(),
      data: {
        products: products || [],
        categories: categories || [],
        customers: customers || [],
        suppliers: suppliers || [],
        mills: mills || [],
        expenses: expenses || [],
        cashTransactions: cashTransactions || [],
        posSales: posSales || [],
        challans: challans || [],
        systemLogs: systemLogs || [],
        ledgerEntries: ledgerEntries || [],
        supplierLedgerEntries: supplierLedgerEntries || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Hydration failed", error: error.message });
  }
};
