import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    clientType: { type: String, default: "General Customer" },
    mill: { type: mongoose.Schema.Types.ObjectId, ref: "Mill" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    clientName: { type: String, required: true },
    partyName: { type: String },
    transactionType: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMode: { type: String, default: "Cash" },
    referenceNumber: { type: String },
    runningBalance: { type: Number, default: 0 },
    notes: { type: String },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export const Ledger = mongoose.model("Ledger", ledgerSchema);
