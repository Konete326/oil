import { Purchase } from "../models/purchaseModel.js";
import { Product } from "../models/productModel.js";
import { connectDB } from "../config/db.js";

export const getPurchases = async (req, res, next) => {
  try {
    await connectDB();
    const { supplier, search } = req.query;
    let query = {};
    if (supplier) query.supplierName = { $regex: supplier, $options: "i" };
    if (search) {
      query.$or = [
        { supplierName: { $regex: search, $options: "i" } },
        { productName: { $regex: search, $options: "i" } },
        { purchaseNumber: { $regex: search, $options: "i" } },
      ];
    }

    const purchases = await Purchase.find(query).sort({ purchaseDate: -1, createdAt: -1 });
    const totalPurchaseCost = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    res.status(200).json({ success: true, count: purchases.length, totalCost: totalPurchaseCost, data: purchases });
  } catch (error) {
    next(error);
  }
};

export const createPurchase = async (req, res, next) => {
  try {
    await connectDB();
    const { supplierName, productId, productName, quantity, unitType, unitPrice, paymentStatus, invoiceNumber, notes } = req.body;

    if (!supplierName || !productName || !quantity || !unitPrice) {
      res.status(400);
      throw new Error("Supplier name, product name, quantity, and unit price are required.");
    }

    const purchaseNumber = `PUR-${Date.now().toString().slice(-6)}`;
    const totalAmount = Number(quantity) * Number(unitPrice);

    const purchase = await Purchase.create({
      purchaseNumber,
      supplierName: supplierName.trim(),
      product: productId || undefined,
      productName: productName.trim(),
      quantity: Number(quantity),
      unitType: unitType || "Liters",
      unitPrice: Number(unitPrice),
      totalAmount,
      paymentStatus: paymentStatus || "Paid",
      invoiceNumber: invoiceNumber || "",
      notes: notes || "",
    });

    if (productId) {
      const prod = await Product.findById(productId);
      if (prod) {
        prod.stockQuantity = (prod.stockQuantity || 0) + Number(quantity);
        await prod.save();
      }
    }

    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};
