import mongoose from "mongoose";

const shopShiftSchema = new mongoose.Schema(
  {
    shiftDate: { type: String, required: true },
    openedAt: { type: Date, required: true },
    closedAt: { type: Date },
    isClosed: { type: Boolean, default: false },
    closedBy: { type: String, default: "System" },
    closeType: { type: String, enum: ["Manual", "Auto"], default: "Manual" },
    totalSales: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    netDayMargin: { type: Number, default: 0 },
    totalLitersSold: { type: Number, default: 0 },
    cashSales: { type: Number, default: 0 },
    creditSales: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 0 },
    totalStockRemainingLiters: { type: Number, default: 0 },
    totalStockValuation: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const ShopShift = mongoose.model("ShopShift", shopShiftSchema);
