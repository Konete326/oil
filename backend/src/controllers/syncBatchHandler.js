import mongoose from "mongoose";
import { PosSale } from "../models/posSaleModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { Expense } from "../models/expenseModel.js";
import { Product } from "../models/productModel.js";
import { Customer } from "../models/customerModel.js";
import { Category } from "../models/categoryModel.js";
import { Supplier } from "../models/supplierModel.js";
import { Mill } from "../models/millModel.js";
import { Challan } from "../models/challanModel.js";
import { SystemLog } from "../models/systemLogModel.js";
import { Ledger } from "../models/ledgerModel.js";
import { SupplierLedger } from "../models/supplierLedgerModel.js";
import { Employee } from "../models/employeeModel.js";
import { SalaryVoucher } from "../models/salaryVoucherModel.js";
import { Purchase } from "../models/purchaseModel.js";

const cleanPayload = (p) => {
  const c = { ...p };
  if (c._id && !mongoose.isValidObjectId(c._id)) delete c._id;
  if (c.id && !mongoose.isValidObjectId(c.id)) delete c.id;
  return c;
};

async function syncUpsert(Model, query, payload, targetId) {
  const cleaned = cleanPayload(payload);
  if (targetId && mongoose.isValidObjectId(targetId)) return await Model.findByIdAndUpdate(targetId, cleaned, { new: true });
  if (query) {
    const existing = await Model.findOne(query);
    if (existing) return await Model.findByIdAndUpdate(existing._id, cleaned, { new: true });
  }
  return await Model.create(cleaned);
}

async function handleDelete(type, targetId) {
  if (type === "system_log_clear") return await SystemLog.deleteMany({});
  if (!targetId || !mongoose.isValidObjectId(targetId)) return;
  const models = { product: Product, category: Category, customer: Customer, expense: Expense, cash: CashTransaction, pos_sale: PosSale, supplier: Supplier, mill: Mill, challan: Challan, system_log: SystemLog, ledger: Ledger, supplier_ledger: SupplierLedger, employee: Employee, salary: SalaryVoucher, purchase: Purchase };
  const key = Object.keys(models).find((k) => type.startsWith(k));
  if (key && models[key]) await models[key].findByIdAndDelete(targetId);
}

async function processSingleItem(item) {
  const { type, action, payload } = item;
  if (!payload) return;
  const targetId = payload._id || payload.id;
  if (action === "delete" || type?.endsWith("_delete") || type === "system_log_clear") return await handleDelete(type, targetId);

  const cleaned = cleanPayload(payload);
  if (type === "pos_sale") {
    const exists = await PosSale.findOne({ saleNumber: payload.saleNumber });
    if (!exists) {
      if (Array.isArray(cleaned.items)) {
        for (const itm of cleaned.items) {
          if (!itm.product || !mongoose.isValidObjectId(itm.product)) {
            const found = await Product.findOne({ name: itm.productName });
            itm.product = found ? found._id : new mongoose.Types.ObjectId();
          }
        }
      }
      await PosSale.create(cleaned);
      if (Array.isArray(payload.items)) {
        for (const itm of payload.items) {
          if (itm.product && mongoose.isValidObjectId(itm.product) && itm.quantity) {
            await Product.findByIdAndUpdate(itm.product, { $inc: { stockQuantity: -Number(itm.quantity) } });
          }
        }
      }
    }
  } else if (type === "cash_entry") await CashTransaction.create(cleaned);
  else if (type === "expense_entry") await Expense.create(cleaned);
  else if (type === "system_log_entry") {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const logDate = payload.createdAt ? new Date(payload.createdAt) : new Date();
    if (logDate >= sevenDaysAgo) await SystemLog.create(cleaned);
  } else if (type === "customer_entry") await syncUpsert(Customer, payload.name ? { name: payload.name } : null, payload, targetId);
  else if (type === "product_entry") {
    if (!cleaned.category || !mongoose.isValidObjectId(cleaned.category)) {
      const cat = await Category.findOne();
      if (cat) cleaned.category = cat._id;
    }
    await syncUpsert(Product, payload.sku ? { sku: payload.sku } : payload.name ? { name: payload.name } : null, cleaned, targetId);
  } else if (type === "category_entry") await syncUpsert(Category, payload.name ? { name: payload.name } : null, payload, targetId);
  else if (type === "supplier_entry") await syncUpsert(Supplier, payload.name ? { name: payload.name } : null, payload, targetId);
  else if (type === "mill_entry") await syncUpsert(Mill, payload.name ? { name: payload.name } : null, payload, targetId);
  else if (type === "employee_entry") await syncUpsert(Employee, payload.name ? { name: payload.name } : null, payload, targetId);
  else if (type === "challan_entry") {
    const exists = await Challan.findOne({ challanNumber: payload.challanNumber });
    if (!exists) await Challan.create(cleaned);
  } else if (type === "ledger_entry") {
    await Ledger.create(cleaned);
    if (payload.mill && mongoose.isValidObjectId(payload.mill) && payload.amount) {
      await Mill.findByIdAndUpdate(payload.mill, { $inc: { currentBalance: -Number(payload.amount) } });
    }
  } else if (type === "supplier_ledger_entry") {
    await SupplierLedger.create(cleaned);
    if (payload.supplier && mongoose.isValidObjectId(payload.supplier) && payload.amount) {
      const delta = payload.transactionType?.includes("Purchase") ? Number(payload.amount) : -Number(payload.amount);
      await Supplier.findByIdAndUpdate(payload.supplier, { $inc: { currentBalance: delta } });
    }
  } else if (type === "salary_voucher_entry") {
    await SalaryVoucher.create(cleaned);
  } else if (type === "purchase_entry") {
    await Purchase.create(cleaned);
  } else if (type === "product_stock" && payload.productId && mongoose.isValidObjectId(payload.productId)) {
    await Product.findByIdAndUpdate(payload.productId, { $inc: { stockQuantity: payload.stockChange } });
  }
}

export const syncBatchOfflineData = async (req, res) => {
  try {
    const { items, operations } = req.body;
    const batchList = Array.isArray(items) ? items : Array.isArray(operations) ? operations : [];
    if (batchList.length === 0) return res.status(200).json({ success: true, message: "No items to sync", syncedIds: [], processedCount: 0 });

    const syncedIds = [];
    for (const item of batchList) {
      try {
        await processSingleItem(item);
      } catch (err) {
        console.error("Batch sync item processing warning:", err.message);
      }
      if (item.id) syncedIds.push(item.id);
    }

    res.status(200).json({ success: true, message: `Processed ${syncedIds.length} operations`, syncedIds, processedCount: syncedIds.length, timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Sync failed", error: error.message });
  }
};
