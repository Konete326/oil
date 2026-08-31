import { Challan } from "../models/challanModel.js";
import { Mill } from "../models/millModel.js";
import { Product } from "../models/productModel.js";

export const getChallans = async (req, res, next) => {
  try {
    const challans = await Challan.find().populate("mill", "name code zone").populate("product", "name sku brand").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: challans.length, data: challans });
  } catch (error) {
    next(error);
  }
};

export const createChallan = async (req, res, next) => {
  try {
    const { millId, productId, productName, vehicleNumber, driverName, driverPhone, dipMeasurementInches, quantityLiters, overrideRate, notes } = req.body;
    let mill = null;
    if (millId) {
      mill = await Mill.findById(millId);
    }
    if (!mill) {
      mill = await Mill.findOne();
    }
    if (!mill) {
      res.status(404);
      throw new Error("Textile Mill profile not found. Please register a Mill first.");
    }

    let product = null;
    if (productId) product = await Product.findById(productId);
    if (!product && productName) product = await Product.findOne({ name: new RegExp(`^${productName.trim()}$`, "i") });
    if (!product) product = await Product.findOne();

    const finalProductName = (productName && productName.trim()) ? productName.trim() : (product?.name || "Bulk Mineral Lubricant Oil");
    const liters = Number(quantityLiters) > 0 ? Number(quantityLiters) : 1000;
    const rate = overrideRate !== undefined && Number(overrideRate) > 0 ? Number(overrideRate) : (mill.contractRatePerLiter || 530);
    const amount = Number((liters * rate).toFixed(2));

    const lastChallan = await Challan.findOne().sort({ createdAt: -1 });
    const nextSeq = lastChallan ? (parseInt(lastChallan.challanNumber.replace("DC-", ""), 10) || 1000) + 1 : 1001;
    const challanNumber = `DC-${nextSeq}`;

    mill.currentBalance += amount;
    await mill.save();

    if (product) {
      product.stockQuantity = Math.max(0, (product.stockQuantity || 0) - liters);
      await product.save();
    }

    const challan = await Challan.create({
      challanNumber,
      mill: mill._id,
      millName: mill.name,
      product: product ? product._id : undefined,
      productName: finalProductName,
      vehicleNumber: vehicleNumber?.trim() ? vehicleNumber.toUpperCase().trim() : "N/A",
      driverName: driverName?.trim() || "Standard Delivery",
      driverPhone: driverPhone?.trim() || "",
      dipMeasurementInches: Number(dipMeasurementInches) || 0,
      quantityLiters: liters,
      ratePerLiter: rate,
      totalAmount: amount,
      notes: notes || "",
    });

    const populated = await Challan.findById(challan._id).populate("mill", "name code zone").populate("product", "name sku brand");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const updateChallanStatus = async (req, res, next) => {
  try {
    const { paymentStatus, gatePassStatus } = req.body;
    const challan = await Challan.findById(req.params.id);
    if (!challan) {
      res.status(404);
      throw new Error("Delivery Challan not found");
    }
    if (paymentStatus) challan.paymentStatus = paymentStatus;
    if (gatePassStatus) challan.gatePassStatus = gatePassStatus;
    await challan.save();
    res.status(200).json({ success: true, data: challan });
  } catch (error) {
    next(error);
  }
};

export const deleteChallan = async (req, res, next) => {
  try {
    const challan = await Challan.findById(req.params.id);
    if (!challan) {
      res.status(404);
      throw new Error("Delivery Challan not found");
    }
    if (challan.mill && challan.totalAmount) {
      await Mill.findByIdAndUpdate(challan.mill, { $inc: { currentBalance: -Number(challan.totalAmount) } });
    }
    if (challan.product && challan.quantityLiters) {
      await Product.findByIdAndUpdate(challan.product, { $inc: { stockQuantity: Number(challan.quantityLiters) } });
    }
    await Challan.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Challan deleted, stock and mill balance restored." });
  } catch (error) {
    next(error);
  }
};
