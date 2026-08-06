import mongoose from "mongoose";

const decantingSchema = new mongoose.Schema(
  {
    sourceProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    sourceProductName: { type: String, required: true },
    sourceDrumsCount: { type: Number, required: true },
    grossLiters: { type: Number, required: true },
    targetUnitType: { type: String, required: true },
    targetUnitSize: { type: Number, required: true },
    wastagePercentage: { type: Number, default: 0.5 },
    wastageLiters: { type: Number, required: true },
    netLiters: { type: Number, required: true },
    producedUnits: { type: Number, required: true },
    remnantLiters: { type: Number, default: 0 },
    operatorName: { type: String, default: "Admin Operator" },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Decanting = mongoose.model("Decanting", decantingSchema);
