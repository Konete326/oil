import { PosSale } from "../models/posSaleModel.js";
import { Product } from "../models/productModel.js";
import { SystemLog } from "../models/systemLogModel.js";
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

    const sale = await PosSale.create({
      saleNumber,
      customerName: customerName || "Walk-in Customer",
      customerPhone,
      saleType: saleType || "Retail",
      items,
      subtotal: Number(subtotal),
      discount: Number(discount) || 0,
      grandTotal: Number(grandTotal),
      paymentMode: paymentMode || "Cash",
      cashReceived: Number(cashReceived) || 0,
      changeDue: Number(changeDue) || 0,
      cashierName: req.user?.name || "Admin Cashier",
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
    if (!sale) {
      res.status(404);
      throw new Error("POS Sale not found");
    }

    const { reason = "Customer Return / Sale Cancellation", notes = "" } = req.body || {};

    if (Array.isArray(sale.items)) {
      for (const item of sale.items) {
        if (item.product) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stockQuantity += Number(item.quantity) || 0;
            await product.save();
          }
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
