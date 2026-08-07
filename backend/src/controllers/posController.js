import { PosSale } from "../models/posSaleModel.js";
import { Product } from "../models/productModel.js";
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
    const {
      customerName,
      customerPhone,
      saleType,
      items,
      subtotal,
      discount,
      taxAmount,
      grandTotal,
      paymentMode,
      cashReceived,
      changeDue,
    } = req.body;

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
          message: `${product.name} (SKU: ${product.sku}) stock dropped to ${product.stockQuantity} ${product.unit} (Alert Limit: ${product.minStockAlert}).`,
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
      taxAmount: Number(taxAmount) || 0,
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
