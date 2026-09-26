import { PosSale } from "../models/posSaleModel.js";
import { Product } from "../models/productModel.js";
import { SystemLog } from "../models/systemLogModel.js";
import { ShopShift } from "../models/shopShiftModel.js";
import { createNotificationHelper } from "./notificationController.js";

export const getPosSales = async (req, res, next) => {
  try {
    const sales = await PosSale.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    next(error);
  }
};

export const createPosSale = async (req, res, next) => {
  try {
    const { customerName, customerPhone, saleType, items, subtotal, discount, grandTotal, paymentMode, cashReceived, changeDue } = req.body;
    if (!items || items.length === 0 || !grandTotal) {
      res.status(400);
      throw new Error("Cart cannot be empty for POS transaction.");
    }
    for (const item of items) {
      if (Number(item.unitPrice) < Number(item.costPrice)) {
        res.status(400);
        throw new Error(`Loss detected on ${item.productName}: Selling rate (Rs ${item.unitPrice}) cannot be lower than cost rate (Rs ${item.costPrice}).`);
      }
      const product = await Product.findById(item.product);
      if (!product) { res.status(404); throw new Error(`Product ${item.productName} not found`); }
      if (product.stockQuantity < item.quantity) {
        res.status(400);
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity} Liters`);
      }
      product.stockQuantity -= item.quantity;
      await product.save();
    }

    const now = new Date();
    const currentHour = (now.getUTCHours() + 5) % 24;
    const todayStr = now.toISOString().split("T")[0];
    const closedShift = await ShopShift.findOne({ shiftDate: todayStr, isClosed: true });
    const isNextDayShift = Boolean(closedShift || currentHour < 10 || currentHour >= 18);
    const lastSale = await PosSale.findOne().sort({ createdAt: -1 });
    const saleNumber = `POS-${lastSale ? (parseInt(lastSale.saleNumber.replace("POS-", ""), 10) || 1000) + 1 : 1001}`;
    const totalCost = items.reduce((sum, it) => sum + ((Number(it.costPrice) || 0) * (Number(it.quantity) || 1)), 0);
    if (Number(grandTotal) < totalCost) {
      res.status(400);
      throw new Error(`Loss detected: Grand Total (Rs ${grandTotal}) cannot be lower than total cost (Rs ${totalCost}).`);
    }
    const totalProfit = Number(grandTotal) - totalCost;

    const sale = await PosSale.create({
      saleNumber,
      customerName: customerName || "Walk-in Customer",
      customerPhone,
      saleType: saleType || "Retail",
      items,
      subtotal: Number(subtotal),
      discount: Number(discount) || 0,
      grandTotal: Number(grandTotal),
      totalCost,
      totalProfit,
      paymentMode: paymentMode || "Cash",
      cashReceived: Number(cashReceived) || 0,
      changeDue: Number(changeDue) || 0,
      cashierName: req.user?.name || "Admin Cashier",
      shiftDate: todayStr,
      isNextDayShift,
    });
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

export const deletePosSale = async (req, res, next) => {
  try {
    if (req.user?.role !== "admin") {
      res.status(403);
      throw new Error("Access denied. Only Super Admin has permission to delete sales records.");
    }
    const sale = await PosSale.findById(req.params.id);
    if (!sale) { res.status(404); throw new Error("POS Sale not found"); }
    const { reason = "Customer Return / Sale Cancellation", notes = "" } = req.body || {};

    if (Array.isArray(sale.items)) {
      for (const item of sale.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stockQuantity: Number(item.quantity) || 0 } });
        }
      }
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

    await createNotificationHelper({
      title: "Sale Record Deleted",
      message: `POS Sale ${sale.saleNumber} deleted by Super Admin (${req.user?.name}). Reason: ${reason}. Inventory stock restored.`,
      type: "sale",
      userName: req.user?.name || "Admin",
      targetRoles: ["admin"],
      metadata: { saleNumber: sale.saleNumber, reason },
    });

    await PosSale.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "POS Sale deleted and inventory restored successfully" });
  } catch (error) {
    next(error);
  }
};
