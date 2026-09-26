import { Employee } from "../models/employeeModel.js";
import { EmployeeAdvance } from "../models/employeeAdvanceModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { connectDB } from "../config/db.js";
import { logActivity } from "./auditController.js";

export const recordEmployeeAdvance = async (req, res, next) => {
  try {
    await connectDB();
    const { employeeId, amount, paymentMode, notes, date } = req.body;
    if (!employeeId || !amount || Number(amount) <= 0) {
      res.status(400);
      throw new Error("Employee ID and a valid advance amount are required.");
    }
    const employee = await Employee.findById(employeeId);
    if (!employee) { res.status(404); throw new Error("Employee profile not found."); }

    const advAmt = Number(amount);
    employee.advanceBalance = (employee.advanceBalance || 0) + advAmt;
    await employee.save();
    const voucherNumber = `ADV-${Date.now().toString().slice(-6)}`;
    const txDate = date ? new Date(date) : new Date();

    const advanceEntry = await EmployeeAdvance.create({
      employee: employee._id,
      employeeName: employee.name,
      type: "Advance Given",
      amount: advAmt,
      runningBalance: employee.advanceBalance,
      paymentMode: paymentMode || "Cash",
      voucherNumber,
      date: txDate,
      notes: notes || `Advance cash paid to staff member ${employee.name}`,
      recordedBy: req.user?.name || "Admin",
    });

    if ((paymentMode || "Cash") === "Cash") {
      await CashTransaction.create({
        type: "Paid",
        partyName: `Advance Salary: ${employee.name}`,
        amount: advAmt,
        category: "Staff Advance",
        referenceNo: voucherNumber,
        paymentMode: "Cash",
        transactionDate: txDate,
        notes: notes || `Advance cash paid to staff member ${employee.name}`,
      });
    }

    await logActivity({
      user: req.user,
      action: "RECORD_STAFF_ADVANCE",
      module: "Employee Payroll",
      details: `Paid Rs. ${advAmt} advance cash to employee ${employee.name} (Voucher: ${voucherNumber})`,
    });

    res.status(201).json({ success: true, data: advanceEntry, currentBalance: employee.advanceBalance });
  } catch (error) {
    next(error);
  }
};
export const getEmployeeAdvanceLedger = async (req, res, next) => {
  try {
    await connectDB();
    const { employeeId, page = 1, limit = 50, startDate, endDate } = req.query;
    let query = {};
    if (employeeId) query.employee = employeeId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [total, entries, allMatching] = await Promise.all([
      EmployeeAdvance.countDocuments(query),
      EmployeeAdvance.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNum),
      EmployeeAdvance.find(query),
    ]);

    const totalGiven = allMatching.filter((e) => e.type === "Advance Given").reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalDeducted = allMatching.filter((e) => e.type === "Salary Deduction").reduce((sum, e) => sum + (e.amount || 0), 0);
    const employeeInfo = employeeId ? await Employee.findById(employeeId) : null;

    res.status(200).json({
      success: true,
      count: entries.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      summary: { totalGiven, totalDeducted, currentBalance: employeeInfo ? employeeInfo.advanceBalance : totalGiven - totalDeducted },
      employee: employeeInfo,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployeeAdvance = async (req, res, next) => {
  try {
    await connectDB();
    const entry = await EmployeeAdvance.findById(req.params.id);
    if (!entry) { res.status(404); throw new Error("Advance record not found."); }
    const employee = await Employee.findById(entry.employee);
    if (employee) {
      const isAdv = entry.type === "Advance Given";
      employee.advanceBalance = isAdv ? Math.max((employee.advanceBalance || 0) - entry.amount, 0) : (employee.advanceBalance || 0) + entry.amount;
      await employee.save();
    }
    await EmployeeAdvance.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Advance record deleted and balance adjusted successfully." });
  } catch (error) {
    next(error);
  }
};
