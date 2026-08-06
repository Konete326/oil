import { Decanting } from "../models/decantingModel.js";
import { Product } from "../models/productModel.js";

export const getDecantingLogs = async (req, res, next) => {
  try {
    const logs = await Decanting.find().populate("sourceProduct", "name sku brand").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    next(error);
  }
};

export const createDecanting = async (req, res, next) => {
  try {
    const {
      sourceProductId,
      sourceDrumsCount,
      targetUnitType,
      targetUnitSize,
      targetProductId,
      wastagePercentage,
      notes,
    } = req.body;

    if (!sourceProductId || !sourceDrumsCount || !targetUnitType || !targetUnitSize) {
      res.status(400);
      throw new Error("Source Product, Source Drums Count, Target Unit Type, and Unit Size are required.");
    }

    const sourceProduct = await Product.findById(sourceProductId);
    if (!sourceProduct) {
      res.status(404);
      throw new Error("Source Master Drum product not found");
    }

    if (sourceProduct.stockQuantity < sourceDrumsCount) {
      res.status(400);
      throw new Error(`Insufficient stock. Available: ${sourceProduct.stockQuantity} Drums.`);
    }

    const drums = Number(sourceDrumsCount);
    const unitSize = Number(targetUnitSize);
    const wastePct = wastagePercentage !== undefined ? Number(wastagePercentage) : 0.5;

    const grossLiters = drums * 208;
    const wastageLiters = Number((grossLiters * (wastePct / 100)).toFixed(2));
    const netLiters = Number((grossLiters - wastageLiters).toFixed(2));
    const producedUnits = Math.floor(netLiters / unitSize);
    const remnantLiters = Number((netLiters % unitSize).toFixed(2));

    sourceProduct.stockQuantity -= drums;
    await sourceProduct.save();

    if (targetProductId) {
      const targetProduct = await Product.findById(targetProductId);
      if (targetProduct) {
        targetProduct.stockQuantity += producedUnits;
        await targetProduct.save();
      }
    }

    const decantingLog = await Decanting.create({
      sourceProduct: sourceProduct._id,
      sourceProductName: sourceProduct.name,
      sourceDrumsCount: drums,
      grossLiters,
      targetUnitType,
      targetUnitSize: unitSize,
      wastagePercentage: wastePct,
      wastageLiters,
      netLiters,
      producedUnits,
      remnantLiters,
      operatorName: req.user?.name || "Admin Operator",
      notes,
    });

    const populated = await Decanting.findById(decantingLog._id).populate("sourceProduct", "name sku brand");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};
