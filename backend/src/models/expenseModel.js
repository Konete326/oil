import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Salaries & Wages",
        "Utilities",
        "Transport & Freight",
        "Rent",
        "Maintenance & Repairs",
        "Office Petty Cash",
        "Official Fees & Licenses",
        "Other",
      ],
      default: "Other",
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentMode: {
      type: String,
      default: "Cash",
    },
    voucherNumber: {
      type: String,
      default: "",
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

expenseSchema.index({ expenseDate: -1 });

export const Expense = mongoose.model("Expense", expenseSchema);
