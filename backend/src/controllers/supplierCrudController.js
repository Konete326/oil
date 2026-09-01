import { Supplier } from "../models/supplierModel.js";
import { SupplierLedger } from "../models/supplierLedgerModel.js";
import { BankAccount } from "../models/bankAccountModel.js";
import { connectDB } from "../config/db.js";

export const getSupplierById = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      res.status(404);
      throw new Error("Supplier not found.");
    }

    const ledgerEntries = await SupplierLedger.find({ supplier: id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { supplier, ledgerEntries } });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { name, phone, address, creditLimit, currentBalance } = req.body;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      res.status(404);
      throw new Error("Supplier not found.");
    }

    if (name && name.trim() !== supplier.name) {
      const existing = await Supplier.findOne({ name: name.trim() });
      if (existing) {
        res.status(400);
        throw new Error("A supplier with this name already exists.");
      }
      supplier.name = name.trim();
    }

    if (phone !== undefined) supplier.phone = phone;
    if (address !== undefined) supplier.address = address;
    if (creditLimit !== undefined) supplier.creditLimit = Number(creditLimit);
    if (currentBalance !== undefined) supplier.currentBalance = Number(currentBalance);

    await supplier.save();
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const supplier = await Supplier.findById(id);

    if (!supplier) {
      res.status(404);
      throw new Error("Supplier not found.");
    }

    await Supplier.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Supplier deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplierTransaction = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const entry = await SupplierLedger.findById(id);

    if (!entry) {
      res.status(404);
      throw new Error("Supplier transaction record not found.");
    }

    if (entry.supplier) {
      const isPayment = entry.transactionType?.toLowerCase().includes("payment");
      const isPurchase = entry.transactionType?.toLowerCase().includes("purchase");
      const amt = Number(entry.amount) || 0;

      if (isPayment) {
        await Supplier.findByIdAndUpdate(entry.supplier, { $inc: { currentBalance: amt } });
        if (entry.bankAccount) {
          await BankAccount.findByIdAndUpdate(entry.bankAccount, { $inc: { currentBalance: amt } });
        }
      } else if (isPurchase) {
        await Supplier.findByIdAndUpdate(entry.supplier, { $inc: { currentBalance: -amt } });
      }
    }

    await SupplierLedger.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Transaction deleted successfully." });
  } catch (error) {
    next(error);
  }
};
