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
    const {
      millId,
      productId,
      vehicleNumber,
      driverName,
      driverPhone,
      dipMeasurementInches,
      quantityLiters,
      overrideRate,
      notes,
    } = req.body;

    if (!millId || !productId || !vehicleNumber || !driverName || !dipMeasurementInches || !quantityLiters) {
      res.status(400);
      throw new Error("Mill, Product, Tanker Vehicle No, Driver, Dip Measurement, and Quantity are required.");
    }

    const mill = await Mill.findById(millId);
    if (!mill) {
      res.status(404);
      throw new Error("Textile Mill profile not found");
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }

    const rate = overrideRate !== undefined && Number(overrideRate) > 0 ? Number(overrideRate) : mill.contractRatePerLiter;
    const liters = Number(quantityLiters);
    const amount = Number((liters * rate).toFixed(2));

    const lastChallan = await Challan.findOne().sort({ createdAt: -1 });
    const nextSeq = lastChallan ? (parseInt(lastChallan.challanNumber.replace("DC-", ""), 10) || 1000) + 1 : 1001;
    const challanNumber = `DC-${nextSeq}`;

    mill.currentBalance += amount;
    await mill.save();

    const challan = await Challan.create({
      challanNumber,
      mill: mill._id,
      millName: mill.name,
      product: product._id,
      productName: product.name,
      vehicleNumber: vehicleNumber.toUpperCase(),
      driverName,
      driverPhone,
      dipMeasurementInches: Number(dipMeasurementInches),
      quantityLiters: liters,
      ratePerLiter: rate,
      totalAmount: amount,
      notes,
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
