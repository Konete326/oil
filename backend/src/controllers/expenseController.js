import { Expense } from "../models/expenseModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { BankAccount } from "../models/bankAccountModel.js";
import { connectDB } from "../config/db.js";
import { logActivity } from "./auditController.js";

export const getExpenses = async (req, res, next) => {
  try {
    await connectDB();
    const { period = "monthly", startDate, endDate, category, search } = req.query;
    let query = {};
    const now = new Date();

    if (period === "daily") {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      query.expenseDate = { $gte: startOfDay };
    } else if (period === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      query.expenseDate = { $gte: startOfMonth };
    } else if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    if (category) query.category = category;
    if (search) {
      query.$or = [{ title: { $regex: search, $options: "i" } }, { voucherNumber: { $regex: search, $options: "i" } }, { notes: { $regex: search, $options: "i" } }];
    }

    const expenses = await Expense.find(query).populate("bankAccount", "bankName accountNumber").sort({ expenseDate: -1, createdAt: -1 });
    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    res.status(200).json({ success: true, count: expenses.length, totalAmount, data: expenses });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    await connectDB();
    const { title, category, amount, paymentMode, bankAccountId, bankAccountName, voucherNumber, expenseDate, notes } = req.body;

    if (!title || !amount || Number(amount) <= 0) {
      res.status(400);
      throw new Error("Title and a valid expense amount are required.");
    }

    let resolvedBankId = bankAccountId || undefined;
    let resolvedBankName = bankAccountName || "";

    if (paymentMode && paymentMode !== "Cash") {
      if (resolvedBankId) {
        const bAcc = await BankAccount.findByIdAndUpdate(resolvedBankId, { $inc: { currentBalance: -Number(amount) } }, { new: true });
        if (bAcc) resolvedBankName = `${bAcc.bankName} - ${bAcc.accountNumber}`;
      } else {
        const defAcc = (await BankAccount.findOne({ isDefault: true, isActive: true })) || (await BankAccount.findOne({ isActive: true }));
        if (defAcc) {
          resolvedBankId = defAcc._id;
          resolvedBankName = `${defAcc.bankName} - ${defAcc.accountNumber}`;
          await BankAccount.findByIdAndUpdate(defAcc._id, { $inc: { currentBalance: -Number(amount) } });
        }
      }
    }

    const expense = await Expense.create({
      title: title.trim(),
      category: category || "Other",
      amount: Number(amount),
      paymentMode: paymentMode || "Cash",
      bankAccount: resolvedBankId,
      bankAccountName: resolvedBankName,
      voucherNumber: voucherNumber || `EXP-${Date.now().toString().slice(-6)}`,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      notes: notes || "",
    });

    await CashTransaction.create({
      type: "Paid",
      partyName: `Expense: ${expense.category}`,
      amount: expense.amount,
      category: expense.category,
      referenceNo: expense.voucherNumber,
      paymentMode: paymentMode || "Cash",
      bankAccount: resolvedBankId,
      bankAccountName: resolvedBankName,
      notes: expense.notes || `Operating Expense: ${expense.title}`,
    });

    await logActivity({
      user: req.user,
      action: "CREATE_EXPENSE",
      module: "Expenses Management",
      details: `Recorded expense '${expense.title}' of Rs. ${expense.amount} (${expense.category})`,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const expense = await Expense.findById(id);
    if (!expense) {
      res.status(404);
      throw new Error("Expense record not found.");
    }

    if (expense.bankAccount) {
      await BankAccount.findByIdAndUpdate(expense.bankAccount, { $inc: { currentBalance: Number(expense.amount) } });
    }
    if (expense.voucherNumber) {
      await CashTransaction.findOneAndDelete({ referenceNo: expense.voucherNumber });
    }

    await Expense.findByIdAndDelete(id);
    await logActivity({ user: req.user, action: "DELETE_EXPENSE", module: "Expenses Management", details: `Deleted expense '${expense.title}' of Rs. ${expense.amount}` });

    res.status(200).json({ success: true, message: "Expense record deleted successfully." });
  } catch (error) {
    next(error);
  }
};
