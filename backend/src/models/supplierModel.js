import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    creditLimit: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Supplier = mongoose.model("Supplier", supplierSchema);
