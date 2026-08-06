import mongoose from "mongoose";

const challanSchema = new mongoose.Schema(
  {
    challanNumber: { type: String, required: true, unique: true },
    mill: { type: mongoose.Schema.Types.ObjectId, ref: "Mill", required: true },
    millName: { type: String, required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    vehicleNumber: { type: String, required: true },
    driverName: { type: String, required: true },
    driverPhone: { type: String },
    dipMeasurementInches: { type: Number, required: true },
    quantityLiters: { type: Number, required: true },
    ratePerLiter: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["Pending", "Partial", "Billed to Ledger"], default: "Pending" },
    gatePassStatus: { type: String, enum: ["Dispatched", "Delivered", "Cancelled"], default: "Dispatched" },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Challan = mongoose.model("Challan", challanSchema);
