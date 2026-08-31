import { Ledger } from "../models/ledgerModel.js";
import { Mill } from "../models/millModel.js";
import { Customer } from "../models/customerModel.js";
import { CashTransaction } from "../models/cashModel.js";

export const getLedgerEntries = async (req, res, next) => {
  try {
    const { millId, customerId, search } = req.query;
    let query = {};
    if (millId) query.mill = millId;
    if (customerId) query.customer = customerId;
    if (search) query.clientName = { $regex: search, $options: "i" };

    const entries = await Ledger.find(query).populate("mill", "name code zone").sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    next(error);
  }
};

export const createPaymentEntry = async (req, res, next) => {
  try {
    const { millId, customerId, clientName, amount, paymentMode, referenceNumber, notes, dueDate } = req.body;

    if ((!millId && !customerId && !clientName) || !amount || Number(amount) <= 0) {
      res.status(400);
      throw new Error("Client selection and a positive payment amount are required.");
    }

    let targetClientName = clientName || "";
    let updatedBalance = 0;
    let targetMill = null;
    let targetCustomer = null;

    if (millId) {
      targetMill = await Mill.findById(millId);
      if (targetMill) {
        targetClientName = targetMill.name;
        targetMill.currentBalance -= Number(amount);
        updatedBalance = targetMill.currentBalance;
        await targetMill.save();
      }
    } else if (customerId) {
      targetCustomer = await Customer.findById(customerId);
      if (targetCustomer) {
        targetClientName = targetCustomer.name;
        targetCustomer.currentBalance -= Number(amount);
        updatedBalance = targetCustomer.currentBalance;
        await targetCustomer.save();
      }
    }

    const entry = await Ledger.create({
      clientType: targetMill ? "Textile Mill" : targetCustomer ? "Retail Customer" : "General Customer",
      mill: targetMill ? targetMill._id : undefined,
      customer: targetCustomer ? targetCustomer._id : undefined,
      clientName: targetClientName,
      transactionType: "Credit (Payment Received)",
      amount: Number(amount),
      paymentMode: paymentMode || "Cash",
      referenceNumber: referenceNumber || `REC-${Date.now().toString().slice(-6)}`,
      runningBalance: updatedBalance,
      notes,
      dueDate: dueDate || undefined,
    });

    if ((paymentMode || "Cash") === "Cash") {
      await CashTransaction.create({
        type: "Received",
        partyName: targetClientName,
        amount: Number(amount),
        category: targetMill ? "Mill Payment" : "Customer Payment",
        referenceNo: entry.referenceNumber,
        paymentMode: "Cash",
        notes: notes || `Payment received from ${targetClientName}`,
      });
    }

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    next(error);
  }
};

export const getAgingReport = async (req, res, next) => {
  try {
    const mills = await Mill.find().select("name code zone currentBalance creditLimit updatedAt");
    const now = new Date();

    const aging = mills.map((m) => {
      const days = Math.floor((now - new Date(m.updatedAt)) / (1000 * 60 * 60 * 24));
      return {
        _id: m._id,
        name: m.name,
        code: m.code,
        zone: m.zone,
        balance: m.currentBalance,
        creditLimit: m.creditLimit,
        daysOverdue: days,
        category: days <= 30 ? "0-30 Days" : days <= 60 ? "31-60 Days" : days <= 90 ? "61-90 Days" : "90+ Days (Overdue)",
      };
    });

    res.status(200).json({ success: true, data: aging });
  } catch (error) {
    next(error);
  }
};
