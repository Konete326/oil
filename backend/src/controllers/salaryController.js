import { SalaryVoucher } from "../models/salaryVoucherModel.js";
import { Employee } from "../models/employeeModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { connectDB } from "../config/db.js";
import { logActivity } from "./auditController.js";

export const getSalaryVouchers = async (req, res, next) => {
  try {
    await connectDB();
    const { monthYear, employeeId, page = 1, limit = 10 } = req.query;
    let query = {};

    if (monthYear) query.monthYear = monthYear;
    if (employeeId) query.employee = employeeId;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await SalaryVoucher.countDocuments(query);
    const vouchers = await SalaryVoucher.find(query).sort({ paymentDate: -1, createdAt: -1 }).skip(skip).limit(limitNum);

    res.status(200).json({
      success: true,
      count: vouchers.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: vouchers,
    });
  } catch (error) {
    next(error);
  }
};

export const generateSalaryVoucher = async (req, res, next) => {
  try {
    await connectDB();
    const { employeeId, monthYear, baseSalary, bonus, advanceDeducted, otherDeductions, paymentMode, notes } = req.body;

    if (!employeeId || !monthYear) {
      res.status(400);
      throw new Error("Employee ID and salary month/year are required.");
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found.");
    }

    const baseAmt = Number(baseSalary) || employee.baseSalary;
    const bonusAmt = Number(bonus) || 0;
    const advDedAmt = Number(advanceDeducted) || 0;
    const othDedAmt = Number(otherDeductions) || 0;

    const netSalaryPaid = Math.max(baseAmt + bonusAmt - advDedAmt - othDedAmt, 0);

    if (advDedAmt > 0) {
      employee.advanceBalance = Math.max(employee.advanceBalance - advDedAmt, 0);
      await employee.save();
    }

    const voucherNumber = `PAY-${Date.now().toString().slice(-6)}`;

    const voucher = await SalaryVoucher.create({
      employee: employee._id,
      employeeName: employee.name,
      monthYear,
      baseSalary: baseAmt,
      bonus: bonusAmt,
      advanceDeducted: advDedAmt,
      otherDeductions: othDedAmt,
      netSalaryPaid,
      paymentMode: paymentMode || "Cash",
      voucherNumber,
      paymentDate: new Date(),
      notes: notes || "",
    });

    if ((paymentMode || "Cash") === "Cash" && netSalaryPaid > 0) {
      await CashTransaction.create({
        type: "Paid",
        partyName: `Salary: ${employee.name}`,
        amount: netSalaryPaid,
        category: "Staff Salary",
        referenceNo: voucherNumber,
        paymentMode: "Cash",
        notes: notes || `Monthly salary paid to ${employee.name} for ${monthYear}`,
      });
    }

    await logActivity({
      user: req.user,
      action: "GENERATE_SALARY_VOUCHER",
      module: "Employee Payroll",
      details: `Generated salary payslip of Rs. ${netSalaryPaid} for ${employee.name} (${monthYear})`,
    });

    res.status(201).json({ success: true, data: voucher });
  } catch (error) {
    next(error);
  }
};
