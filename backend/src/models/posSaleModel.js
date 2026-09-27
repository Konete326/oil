import mongoose from "mongoose";

const posSaleItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  sku: { type: String },
  unitType: { type: String, default: "Liters" },
  quantity: { type: Number, required: true, min: 0.01 },
  costPrice: { type: Number, default: 0 },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
});

const posSaleSchema = new mongoose.Schema(
  {
    saleNumber: { type: String, required: true, unique: true },
    customerName: { type: String, default: "Walk-in Customer" },
    customerPhone: { type: String },
    saleType: { type: String, enum: ["Retail", "Wholesale"], default: "Retail" },
    items: [posSaleItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    totalCost: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    paymentMode: { type: String, enum: ["Cash", "Card", "Bank Transfer", "Credit / Khata"], default: "Cash" },
    cashReceived: { type: Number, default: 0 },
    changeDue: { type: Number, default: 0 },
    cashierName: { type: String, default: "Admin Cashier" },
    shiftDate: { type: String },
    isNextDayShift: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PosSale = mongoose.model("PosSale", posSaleSchema);
