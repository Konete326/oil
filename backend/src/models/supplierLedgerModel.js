import mongoose from "mongoose";

const supplierLedgerSchema = new mongoose.Schema(
  {
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["Purchase (Credit)", "Payment (Debit)"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
      default: "Cash",
    },
    referenceNumber: {
      type: String,
      default: "",
    },
    runningBalance: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const SupplierLedger = mongoose.model("SupplierLedger", supplierLedgerSchema);
