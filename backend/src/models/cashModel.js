import mongoose from "mongoose";

const cashTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Paid", "Received"],
      required: true,
    },
    partyName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    referenceNo: {
      type: String,
      trim: true,
      default: "",
    },
    paymentMode: {
      type: String,
      default: "Cash",
      trim: true,
    },
    bankAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
    },
    bankAccountName: {
      type: String,
      default: "",
      trim: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

cashTransactionSchema.index({ partyName: 1, type: 1 });
cashTransactionSchema.index({ transactionDate: -1 });

export const CashTransaction = mongoose.model("CashTransaction", cashTransactionSchema);
