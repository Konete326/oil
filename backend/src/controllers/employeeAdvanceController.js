import { Employee } from "../models/employeeModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { connectDB } from "../config/db.js";
import { logActivity } from "./auditController.js";

export const recordEmployeeAdvance = async (req, res, next) => {
  try {
    await connectDB();
    const { employeeId, amount, paymentMode, notes, reason, date } = req.body;

    if (!employeeId || !amount || Number(amount) <= 0) {
      res.status(400);
      throw new Error("Employee ID and a valid advance amount are required.");
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found.");
    }

    const advAmt = Number(amount);
    employee.advanceBalance = (employee.advanceBalance || 0) + advAmt;
    await employee.save();

    const voucherNumber = `ADV-${Date.now().toString().slice(-6)}`;
    const txDate = date ? new Date(date) : new Date();
    const txRemarks = notes || reason || `Advance cash paid to staff member ${employee.name}`;

    const cashTx = await CashTransaction.create({
      type: "Paid",
      partyName: `Advance Salary: ${employee.name}`,
      amount: advAmt,
      category: "Staff Advance",
      referenceNo: voucherNumber,
      paymentMode: paymentMode || "Cash",
      transactionDate: isNaN(txDate.getTime()) ? new Date() : txDate,
      notes: txRemarks,
    });

    await logActivity({
      user: req.user,
      action: "RECORD_STAFF_ADVANCE",
      module: "Employee Payroll",
      details: `Paid Rs. ${advAmt} advance cash to employee ${employee.name} (Voucher: ${voucherNumber})`,
    });

    res.status(201).json({
      success: true,
      data: employee,
      transaction: cashTx,
      voucherNumber,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeAdvances = async (req, res, next) => {
  try {
    await connectDB();
    const advances = await CashTransaction.find({ category: "Staff Advance" })
      .sort({ transactionDate: -1, createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, count: advances.length, data: advances });
  } catch (error) {
    next(error);
  }
};
