import { BankAccount } from "../models/bankAccountModel.js";
import { connectDB } from "../config/db.js";

export const getBankAccounts = async (req, res, next) => {
  try {
    await connectDB();
    const accounts = await BankAccount.find().sort({ isDefault: -1, createdAt: -1 });
    const totalBankBalance = accounts.reduce((acc, a) => acc + (a.isActive ? a.currentBalance || 0 : 0), 0);
    const activeCount = accounts.filter((a) => a.isActive).length;
    const defaultAccount = accounts.find((a) => a.isDefault && a.isActive) || accounts[0] || null;

    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts,
      summary: { totalBankBalance, activeCount, defaultAccount },
    });
  } catch (error) {
    next(error);
  }
};

export const createBankAccount = async (req, res, next) => {
  try {
    await connectDB();
    const { bankName, accountTitle, accountNumber, iban, branchName, branchCode, openingBalance, isDefault, notes } = req.body;

    if (!bankName?.trim() || !accountTitle?.trim()) {
      res.status(400);
      throw new Error("Bank name and account title are required.");
    }

    if (isDefault) {
      await BankAccount.updateMany({}, { isDefault: false });
    }

    const count = await BankAccount.countDocuments();
    const opBal = Number(openingBalance) || 0;
    const account = await BankAccount.create({
      bankName: bankName.trim(),
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber ? accountNumber.trim() : "-",
      iban: iban ? iban.trim().toUpperCase() : "",
      branchName: branchName ? branchName.trim() : "",
      branchCode: branchCode ? branchCode.trim() : "",
      openingBalance: opBal,
      currentBalance: opBal,
      isDefault: Boolean(isDefault || count === 0),
      isActive: true,
      notes: notes ? notes.trim() : "",
    });

    res.status(201).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
};

export const updateBankAccount = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { bankName, accountTitle, accountNumber, iban, branchName, branchCode, isActive, isDefault, notes, currentBalance } = req.body;

    const account = await BankAccount.findById(id);
    if (!account) {
      res.status(404);
      throw new Error("Bank account not found.");
    }

    if (isDefault) {
      await BankAccount.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }

    if (bankName !== undefined) account.bankName = bankName.trim();
    if (accountTitle !== undefined) account.accountTitle = accountTitle.trim();
    if (accountNumber !== undefined) account.accountNumber = accountNumber.trim() || "-";
    if (iban !== undefined) account.iban = iban.trim().toUpperCase();
    if (branchName !== undefined) account.branchName = branchName.trim();
    if (branchCode !== undefined) account.branchCode = branchCode.trim();
    if (isActive !== undefined) account.isActive = Boolean(isActive);
    if (isDefault !== undefined) account.isDefault = Boolean(isDefault);
    if (notes !== undefined) account.notes = notes.trim();
    if (currentBalance !== undefined) account.currentBalance = Number(currentBalance);

    const updated = await account.save();
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteBankAccount = async (req, res, next) => {
  try {
    await connectDB();
    const account = await BankAccount.findById(req.params.id);
    if (!account) {
      res.status(404);
      throw new Error("Bank account not found.");
    }
    await BankAccount.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Bank account deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const setDefaultBankAccount = async (req, res, next) => {
  try {
    await connectDB();
    await BankAccount.updateMany({}, { isDefault: false });
    const account = await BankAccount.findByIdAndUpdate(req.params.id, { isDefault: true, isActive: true }, { new: true });
    if (!account) {
      res.status(404);
      throw new Error("Bank account not found.");
    }
    res.status(200).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
};
