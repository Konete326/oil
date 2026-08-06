import mongoose from "mongoose";

const millSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    zone: { type: String, default: "Korangi Industrial Area" },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    ntnNumber: { type: String },
    contractRatePerLiter: { type: Number, required: true },
    creditLimit: { type: Number, default: 500000 },
    currentBalance: { type: Number, default: 0 },
    address: { type: String },
  },
  { timestamps: true }
);

export const Mill = mongoose.model("Mill", millSchema);
