import { CashTransaction } from "../models/cashModel.js";
import { connectDB } from "../config/db.js";

export const getCashTransactions = async (req, res, next) => {
  try {
    await connectDB();
    const { type, search, startDate, endDate } = req.query;
    let query = {};

    if (type && ["Paid", "Received"].includes(type)) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { partyName: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { referenceNo: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }

    const transactions = await CashTransaction.find(query).sort({ transactionDate: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    next(error);
  }
};

export const createCashTransaction = async (req, res, next) => {
  try {
    await connectDB();
    const { type, partyName, amount, category, referenceNo, paymentMode, transactionDate, notes } = req.body;

    if (!type || !["Paid", "Received"].includes(type)) {
      res.status(400);
      throw new Error("Transaction type must be either Paid or Received.");
    }

    if (!partyName || !partyName.trim()) {
      res.status(400);
      throw new Error("Party name is required.");
    }

    if (!amount || Number(amount) <= 0) {
      res.status(400);
      throw new Error("Valid positive cash amount is required.");
    }

    const transaction = await CashTransaction.create({
      type,
      partyName: partyName.trim(),
      amount: Number(amount),
      category: category || "General",
      referenceNo: referenceNo || "",
      paymentMode: paymentMode || "Cash",
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      notes: notes || "",
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

export const getPartyCashSummary = async (req, res, next) => {
  try {
    await connectDB();
    const summary = await CashTransaction.aggregate([
      {
        $group: {
          _id: "$partyName",
          totalPaid: {
            $sum: { $cond: [{ $eq: ["$type", "Paid"] }, "$amount", 0] },
          },
          totalReceived: {
            $sum: { $cond: [{ $eq: ["$type", "Received"] }, "$amount", 0] },
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$type", "Paid"] }, 1, 0] },
          },
          receivedCount: {
            $sum: { $cond: [{ $eq: ["$type", "Received"] }, 1, 0] },
          },
          lastTransactionDate: { $max: "$transactionDate" },
        },
      },
      {
        $project: {
          partyName: "$_id",
          totalPaid: 1,
          totalReceived: 1,
          netBalance: { $subtract: ["$totalReceived", "$totalPaid"] },
          paidCount: 1,
          receivedCount: 1,
          lastTransactionDate: 1,
        },
      },
      { $sort: { partyName: 1 } },
    ]);

    res.status(200).json({ success: true, count: summary.length, data: summary });
  } catch (error) {
    next(error);
  }
};

export const deleteCashTransaction = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const deleted = await CashTransaction.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404);
      throw new Error("Cash transaction entry not found.");
    }
    res.status(200).json({ success: true, message: "Transaction deleted successfully" });
  } catch (error) {
    next(error);
  }
};
