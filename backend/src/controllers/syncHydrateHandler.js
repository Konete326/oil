import { Product } from "../models/productModel.js";
import { Category } from "../models/categoryModel.js";
import { Customer } from "../models/customerModel.js";
import { Supplier } from "../models/supplierModel.js";
import { Mill } from "../models/millModel.js";
import { Expense } from "../models/expenseModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { PosSale } from "../models/posSaleModel.js";
import { Challan } from "../models/challanModel.js";
import { Decanting } from "../models/decantingModel.js";

export const getHydrateData = async (req, res) => {
  try {
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
      decantings,
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
      Decanting.find().sort({ createdAt: -1 }).limit(200).lean(),
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
        decantings: decantings || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Hydration failed", error: error.message });
  }
};
