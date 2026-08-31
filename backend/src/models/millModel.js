import mongoose from "mongoose";

const millSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    code: { type: String, required: true, unique: true },
    zone: { type: String, default: "Korangi Industrial Area" },
    contactPerson: { type: String, default: "-" },
    phone: { type: String, default: "-" },
    ntnNumber: { type: String, default: "" },
    contractRatePerLiter: { type: Number, default: 0 },
    creditLimit: { type: Number, default: 500000 },
    currentBalance: { type: Number, default: 0 },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Mill = mongoose.model("Mill", millSchema);
