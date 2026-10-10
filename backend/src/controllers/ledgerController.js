import { Ledger } from "../models/ledgerModel.js";
import { Mill } from "../models/millModel.js";
import mongoose from "mongoose";

export const getLedgerEntries = async (req, res, next) => {
  try {
    const { millId, search } = req.query;
    let query = {};
    if (millId) query.mill = millId;
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

    if ((!millId && !clientName && !customerId) || !amount || Number(amount) <= 0) {
      res.status(400);
      throw new Error("Client selection and a positive payment amount are required.");
    }

    let targetClientName = clientName || "";
    let updatedBalance = 0;
    let targetMill = null;

    if (millId) {
      targetMill = await Mill.findById(millId);
      if (!targetMill) {
        res.status(404);
        throw new Error("Textile Mill profile not found");
      }
      targetClientName = targetMill.name;
      targetMill.currentBalance -= Number(amount);
      updatedBalance = targetMill.currentBalance;
      await targetMill.save();
    } else if (customerId) {
      const { Customer } = await import("../models/customerModel.js");
      const targetCustomer = await Customer.findById(customerId);
      if (targetCustomer) {
        targetClientName = targetCustomer.name;
        targetCustomer.currentBalance -= Number(amount);
        updatedBalance = targetCustomer.currentBalance;
        await targetCustomer.save();
      }
    }

    const entry = await Ledger.create({
      clientType: targetMill ? "Textile Mill" : "General Customer",
      mill: targetMill ? targetMill._id : undefined,
      customer: customerId || undefined,
      clientName: targetClientName,
      transactionType: "Credit (Payment Received)",
      amount: Number(amount),
      paymentMode: paymentMode || "Cash",
      referenceNumber,
      runningBalance: updatedBalance,
      notes,
      dueDate: dueDate || undefined,
    });

    const populated = await Ledger.findById(entry._id).populate("mill", "name code zone");
    res.status(201).json({ success: true, data: populated });
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

export const updateLedgerEntry = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { amount, transactionType, paymentMode, referenceNumber, notes, createdAt } = req.body;
    
    const entry = await Ledger.findById(id).session(session);
    if (!entry) {
      res.status(404);
      throw new Error("Ledger entry not found");
    }

    const oldAmount = entry.amount;
    const oldType = entry.transactionType;

    if (amount !== undefined) entry.amount = Number(amount);
    if (transactionType) entry.transactionType = transactionType;
    if (paymentMode) entry.paymentMode = paymentMode;
    if (referenceNumber !== undefined) entry.referenceNumber = referenceNumber;
    if (notes !== undefined) entry.notes = notes;
    if (createdAt) entry.createdAt = new Date(createdAt);
    
    await entry.save({ session });

    let targetModel = null;
    let targetId = null;
    if (entry.customer) {
      targetModel = (await import("../models/customerModel.js")).Customer;
      targetId = entry.customer;
    } else if (entry.mill) {
      targetModel = (await import("../models/millModel.js")).Mill;
      targetId = entry.mill;
    }

    if (targetModel && targetId) {
      const targetDoc = await targetModel.findById(targetId).session(session);
      if (targetDoc) {
        // Recalculate everything to be absolutely safe (ACID properties for edits)
        // because date could be changed, altering the running balances completely.
        const allEntries = await Ledger.find({ $or: [{ customer: targetId }, { mill: targetId }] })
          .sort({ createdAt: 1 })
          .session(session);
        
        // Find total effect of all ledgers
        let sumDebits = 0;
        let sumCredits = 0;
        for (const e of allEntries) {
          if (e.transactionType.includes("Debit")) sumDebits += e.amount;
          else if (e.transactionType.includes("Credit")) sumCredits += e.amount;
        }

        // We know what the currentBalance IS, and what the old effect WAS.
        // But since we already saved `entry`, `allEntries` HAS the new amount.
        // Wait! We don't have the old effect here without re-computing it.
        // Since we already saved it, we can compute difference manually.
        
        let oldEffect = 0;
        if (oldType.includes("Debit")) oldEffect = oldAmount;
        else if (oldType.includes("Credit")) oldEffect = -oldAmount;

        let newEffect = 0;
        if (entry.transactionType.includes("Debit")) newEffect = entry.amount;
        else if (entry.transactionType.includes("Credit")) newEffect = -entry.amount;

        const difference = newEffect - oldEffect;

        targetDoc.currentBalance = (targetDoc.currentBalance || 0) + difference;
        await targetDoc.save({ session });
        
        // Compute running balance properly
        // Initial balance before ALL ledgers:
        const initialBalance = targetDoc.currentBalance - (sumDebits - sumCredits);
        
        let currentRunning = initialBalance;
        for (const e of allEntries) {
          if (e.transactionType.includes("Debit")) currentRunning += e.amount;
          else if (e.transactionType.includes("Credit")) currentRunning -= e.amount;
          
          e.runningBalance = currentRunning;
          await e.save({ session });
        }
      }
    }

    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const createLedgerEntry = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { millId, customerId, clientName, amount, transactionType, paymentMode, referenceNumber, notes, createdAt } = req.body;
    
    if (!millId && !customerId && !clientName) {
      res.status(400);
      throw new Error("Client (Mill or Customer) is required.");
    }
    
    let targetModel = null;
    let targetId = null;
    let finalClientName = clientName;

    if (customerId) {
      targetModel = (await import("../models/customerModel.js")).Customer;
      targetId = customerId;
    } else if (millId) {
      targetModel = (await import("../models/millModel.js")).Mill;
      targetId = millId;
    }

    let targetDoc = null;
    if (targetModel && targetId) {
      targetDoc = await targetModel.findById(targetId).session(session);
      if (targetDoc) finalClientName = targetDoc.name;
    }

    const entry = new Ledger({
      clientType: millId ? "Textile Mill" : (customerId ? "General Customer" : "Other"),
      mill: millId || undefined,
      customer: customerId || undefined,
      partyName: finalClientName,
      clientName: finalClientName,
      transactionType,
      amount: Number(amount),
      paymentMode: paymentMode || "Cash",
      referenceNumber,
      notes,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    });

    await entry.save({ session });

    if (targetDoc) {
      const effect = entry.transactionType.includes("Debit") ? entry.amount : -entry.amount;
      targetDoc.currentBalance = (targetDoc.currentBalance || 0) + effect;
      await targetDoc.save({ session });
      
      const allEntries = await Ledger.find({ $or: [{ customer: targetId }, { mill: targetId }] })
          .sort({ createdAt: 1 })
          .session(session);
          
      let sumDebits = 0;
      let sumCredits = 0;
      for (const e of allEntries) {
        if (e.transactionType.includes("Debit")) sumDebits += e.amount;
        else if (e.transactionType.includes("Credit")) sumCredits += e.amount;
      }
      const initialBalance = targetDoc.currentBalance - (sumDebits - sumCredits);
      let currentRunning = initialBalance;
      for (const e of allEntries) {
        if (e.transactionType.includes("Debit")) currentRunning += e.amount;
        else if (e.transactionType.includes("Credit")) currentRunning -= e.amount;
        e.runningBalance = currentRunning;
        await e.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const deleteLedgerEntry = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const entry = await Ledger.findById(id).session(session);
    
    if (!entry) {
      res.status(404);
      throw new Error("Ledger entry not found");
    }

    let targetModel = null;
    let targetId = null;
    
    if (entry.customer) {
      targetModel = (await import("../models/customerModel.js")).Customer;
      targetId = entry.customer;
    } else if (entry.mill) {
      targetModel = (await import("../models/millModel.js")).Mill;
      targetId = entry.mill;
    }

    const oldEffect = entry.transactionType.includes("Debit") ? entry.amount : -entry.amount;
    
    await Ledger.findByIdAndDelete(id).session(session);

    if (targetModel && targetId) {
      const targetDoc = await targetModel.findById(targetId).session(session);
      if (targetDoc) {
        targetDoc.currentBalance = (targetDoc.currentBalance || 0) - oldEffect;
        await targetDoc.save({ session });
        
        const allEntries = await Ledger.find({ $or: [{ customer: targetId }, { mill: targetId }] })
            .sort({ createdAt: 1 })
            .session(session);
            
        let sumDebits = 0;
        let sumCredits = 0;
        for (const e of allEntries) {
          if (e.transactionType.includes("Debit")) sumDebits += e.amount;
          else if (e.transactionType.includes("Credit")) sumCredits += e.amount;
        }
        const initialBalance = targetDoc.currentBalance - (sumDebits - sumCredits);
        let currentRunning = initialBalance;
        for (const e of allEntries) {
          if (e.transactionType.includes("Debit")) currentRunning += e.amount;
          else if (e.transactionType.includes("Credit")) currentRunning -= e.amount;
          e.runningBalance = currentRunning;
          await e.save({ session });
        }
      }
    }

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ success: true, message: "Ledger entry deleted" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
