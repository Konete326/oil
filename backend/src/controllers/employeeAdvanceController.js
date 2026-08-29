import { Employee } from "../models/employeeModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { connectDB } from "../config/db.js";
import { logActivity } from "./auditController.js";

export const recordEmployeeAdvance = async (req, res, next) => {
  try {
    await connectDB();
    const { employeeId, amount, paymentMode, notes } = req.body;

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

    if ((paymentMode || "Cash") === "Cash") {
      await CashTransaction.create({
        type: "Paid",
        partyName: `Advance Salary: ${employee.name}`,
        amount: advAmt,
        category: "Staff Advance",
        referenceNo: `ADV-${Date.now().toString().slice(-6)}`,
        paymentMode: "Cash",
        notes: notes || `Advance cash paid to staff member ${employee.name}`,
      });
    }

    await logActivity({
      user: req.user,
      action: "RECORD_STAFF_ADVANCE",
      module: "Employee Payroll",
      details: `Paid Rs. ${advAmt} advance cash to employee ${employee.name}`,
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};
