import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    clientType: { type: String, enum: ["Textile Mill", "General Customer"], default: "Textile Mill" },
    mill: { type: mongoose.Schema.Types.ObjectId, ref: "Mill" },
    clientName: { type: String, required: true },
    transactionType: { type: String, enum: ["Debit (Invoice/Challan)", "Credit (Payment Received)"], required: true },
    amount: { type: Number, required: true },
    paymentMode: { type: String, enum: ["Cash", "Cheque", "Bank Transfer", "Online POS"], default: "Cash" },
    referenceNumber: { type: String },
    runningBalance: { type: Number, required: true },
    notes: { type: String },
    dueDate: { type: Date },
  },
  { timestamps: true }
);

export const Ledger = mongoose.model("Ledger", ledgerSchema);
