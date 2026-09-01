import { PosSale } from "../models/posSaleModel.js";
import { Product } from "../models/productModel.js";
import { Customer } from "../models/customerModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { BankAccount } from "../models/bankAccountModel.js";
import { SystemLog } from "../models/systemLogModel.js";
import { createNotificationHelper } from "./notificationController.js";
import { connectDB } from "../config/db.js";

export const getPosSales = async (req, res, next) => {
  try {
    await connectDB();
    const sales = await PosSale.find().populate("bankAccount", "bankName accountNumber").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    next(error);
  }
};

export const createPosSale = async (req, res, next) => {
  try {
    await connectDB();
    const { customerName, customerPhone, customerId, saleType, items, subtotal, discount, grandTotal, paymentMode, bankAccountId, bankAccountName, cashReceived, changeDue } = req.body;
    if (!items || items.length === 0 || !grandTotal) {
      res.status(400);
      throw new Error("Cart cannot be empty for POS transaction.");
    }

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        res.status(404);
        throw new Error(`Product ${item.productName} not found`);
      }
      if (product.stockQuantity < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity} ${product.unit}`);
      }
      product.stockQuantity -= item.quantity;
      await product.save();

      if (product.stockQuantity <= product.minStockAlert) {
        await createNotificationHelper({
          title: "Low Stock Alert",
          message: `${product.name} stock dropped to ${product.stockQuantity} ${product.unit}.`,
          type: "stock",
          userName: req.user?.name || "System",
          targetRoles: ["admin", "manager", "cashier"],
          metadata: { productId: product._id, currentStock: product.stockQuantity },
        });
      }
    }

    const lastSale = await PosSale.findOne().sort({ createdAt: -1 });
    const nextSeq = lastSale ? (parseInt(lastSale.saleNumber.replace("POS-", ""), 10) || 1000) + 1 : 1001;
    const saleNumber = `POS-${nextSeq}`;
    const totalAmount = Number(grandTotal);

    let resolvedBankId = bankAccountId || undefined;
    let resolvedBankName = bankAccountName || "";

    if (paymentMode === "Bank Transfer" || paymentMode === "Card") {
      if (resolvedBankId) {
        const bAcc = await BankAccount.findByIdAndUpdate(resolvedBankId, { $inc: { currentBalance: totalAmount } }, { new: true });
        if (bAcc) resolvedBankName = `${bAcc.bankName} - ${bAcc.accountNumber}`;
      } else {
        const defAcc = (await BankAccount.findOne({ isDefault: true, isActive: true })) || (await BankAccount.findOne({ isActive: true }));
        if (defAcc) {
          resolvedBankId = defAcc._id;
          resolvedBankName = `${defAcc.bankName} - ${defAcc.accountNumber}`;
          await BankAccount.findByIdAndUpdate(defAcc._id, { $inc: { currentBalance: totalAmount } });
        }
      }
    }

    const sale = await PosSale.create({
      saleNumber,
      customerName: customerName || "Walk-in Customer",
      customerPhone,
      saleType: saleType || "Retail",
      items,
      subtotal: Number(subtotal),
      discount: Number(discount) || 0,
      grandTotal: totalAmount,
      paymentMode: paymentMode || "Cash",
      bankAccount: resolvedBankId,
      bankAccountName: resolvedBankName,
      cashReceived: Number(cashReceived) || 0,
      changeDue: Number(changeDue) || 0,
      cashierName: req.user?.name || "Admin Cashier",
    });

    if (paymentMode === "Credit / Khata" && customerName && customerName !== "Walk-in Customer") {
      const custQuery = customerId ? { _id: customerId } : { name: customerName.trim() };
      await Customer.findOneAndUpdate(custQuery, { $inc: { currentBalance: totalAmount } });
    } else {
      await CashTransaction.create({
        type: "Received",
        partyName: customerName || "Walk-in Customer",
        amount: totalAmount,
        category: "POS Sale",
        referenceNo: saleNumber,
        paymentMode: paymentMode || "Cash",
        bankAccount: resolvedBankId,
        bankAccountName: resolvedBankName,
        notes: `POS Counter Sale (${saleType || "Retail"})${resolvedBankName ? ` | ${resolvedBankName}` : ""}`,
      });
    }

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

export const deletePosSale = async (req, res, next) => {
  try {
    await connectDB();
    if (req.user?.role !== "admin") {
      res.status(403);
      throw new Error("Access denied. Only Super Admin has permission to delete sales records.");
    }

    const sale = await PosSale.findById(req.params.id);
    if (!sale) {
      res.status(404);
      throw new Error("POS Sale not found");
    }

    const { reason = "Customer Return / Sale Cancellation", notes = "" } = req.body || {};

    if (Array.isArray(sale.items)) {
      for (const item of sale.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stockQuantity: Number(item.quantity) || 0 } });
        }
      }
    }

    if (sale.paymentMode === "Credit / Khata" && sale.customerName && sale.customerName !== "Walk-in Customer") {
      await Customer.findOneAndUpdate({ name: sale.customerName }, { $inc: { currentBalance: -Number(sale.grandTotal) } });
    } else if (sale.bankAccount) {
      await BankAccount.findByIdAndUpdate(sale.bankAccount, { $inc: { currentBalance: -Number(sale.grandTotal) } });
      await CashTransaction.findOneAndDelete({ referenceNo: sale.saleNumber });
    } else {
      await CashTransaction.findOneAndDelete({ referenceNo: sale.saleNumber });
    }

    await SystemLog.create({
      title: "POS Sale Deleted & Stock Restored",
      message: `Sale ${sale.saleNumber} (Rs ${sale.grandTotal}) deleted by Super Admin (${req.user?.name || "Admin"}). Reason: ${reason}${notes ? " | " + notes : ""}. Stock restored.`,
      level: "warning",
      source: "backend",
      userName: req.user?.name || "Admin",
      userRole: "admin",
      metadata: { saleId: sale._id, saleNumber: sale.saleNumber, grandTotal: sale.grandTotal, reason, notes },
    });

    await PosSale.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "POS Sale deleted, stock, cash, and khata restored." });
  } catch (error) {
    next(error);
  }
};
