import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, required: true },
    customer: { type: String, required: true },
    amount: { type: String, required: true },
    status: { type: String, enum: ["Paid", "Pending", "Overdue"], default: "Pending" },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
