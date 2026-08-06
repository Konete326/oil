import { Supplier } from "../models/supplierModel.js";
import { SupplierLedger } from "../models/supplierLedgerModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { connectDB } from "../config/db.js";

export const getSuppliers = async (req, res, next) => {
  try {
    await connectDB();
    const { search } = req.query;
    let query = {};
    if (search) query.name = { $regex: search, $options: "i" };

    const suppliers = await Supplier.find(query).sort({ name: 1 });
    res.status(200).json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    await connectDB();
    const { name, phone, address, creditLimit, openingBalance } = req.body;

    if (!name || !name.trim()) {
      res.status(400);
      throw new Error("Supplier name is required.");
    }

    const existing = await Supplier.findOne({ name: name.trim() });
    if (existing) {
      res.status(400);
      throw new Error("A supplier with this name already exists.");
    }

    const supplier = await Supplier.create({
      name: name.trim(),
      phone: phone || "",
      address: address || "",
      creditLimit: Number(creditLimit) || 0,
      currentBalance: Number(openingBalance) || 0,
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const createSupplierPayment = async (req, res, next) => {
  try {
    await connectDB();
    const { supplierId, amount, paymentMode, referenceNumber, notes } = req.body;

    if (!supplierId || !amount || Number(amount) <= 0) {
      res.status(400);
      throw new Error("Supplier ID and a valid payment amount are required.");
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      res.status(404);
      throw new Error("Supplier profile not found.");
    }

    const payAmt = Number(amount);
    supplier.currentBalance -= payAmt;
    await supplier.save();

    const ledgerEntry = await SupplierLedger.create({
      supplier: supplier._id,
      supplierName: supplier.name,
      transactionType: "Payment (Debit)",
      amount: payAmt,
      paymentMode: paymentMode || "Cash",
      referenceNumber: referenceNumber || "",
      runningBalance: supplier.currentBalance,
      notes: notes || "",
    });

    if (paymentMode === "Cash") {
      await CashTransaction.create({
        type: "Paid",
        partyName: supplier.name,
        amount: payAmt,
        category: "Vendor Payment",
        referenceNo: referenceNumber || "",
        paymentMode: "Cash",
        notes: notes || `Payment paid to supplier ${supplier.name}`,
      });
    }

    res.status(201).json({ success: true, data: ledgerEntry });
  } catch (error) {
    next(error);
  }
};

export const getSupplierLedger = async (req, res, next) => {
  try {
    await connectDB();
    const { supplierId } = req.params;
    let query = {};
    if (supplierId) query.supplier = supplierId;

    const entries = await SupplierLedger.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    next(error);
  }
};
