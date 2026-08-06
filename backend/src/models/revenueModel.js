import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    sales: { type: Number, required: true },
  },
  { timestamps: true }
);

export const Revenue = mongoose.model("Revenue", revenueSchema);
