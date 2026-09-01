import mongoose from "mongoose";

const bankAccountSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: [true, "Bank name is required"],
      trim: true,
    },
    accountTitle: {
      type: String,
      required: [true, "Account title is required"],
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
      default: "-",
    },
    iban: {
      type: String,
      trim: true,
      default: "",
    },
    branchName: {
      type: String,
      trim: true,
      default: "",
    },
    branchCode: {
      type: String,
      trim: true,
      default: "",
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

bankAccountSchema.index({ bankName: 1, accountNumber: 1 });

export const BankAccount = mongoose.model("BankAccount", bankAccountSchema);
