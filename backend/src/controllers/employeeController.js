import { Employee } from "../models/employeeModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { connectDB } from "../config/db.js";
import { logActivity } from "./auditController.js";

export const getEmployees = async (req, res, next) => {
  try {
    await connectDB();
    const { search, page = 1, limit = 10 } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { designation: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum);

    res.status(200).json({
      success: true,
      count: employees.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    await connectDB();
    const { name, designation, department, phone, baseSalary, joiningDate, status } = req.body;

    if (!name || !designation || !baseSalary || Number(baseSalary) <= 0) {
      res.status(400);
      throw new Error("Name, designation, and a valid base salary are required.");
    }

    const employee = await Employee.create({
      name: name.trim(),
      designation: designation.trim(),
      department: department || "General",
      phone: phone || "",
      baseSalary: Number(baseSalary),
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      status: status || "Active",
    });

    await logActivity({
      user: req.user,
      action: "CREATE_EMPLOYEE",
      module: "Employee Payroll",
      details: `Created employee profile ${employee.name} (${employee.designation})`,
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { name, designation, department, phone, baseSalary, status } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found.");
    }

    if (name) employee.name = name.trim();
    if (designation) employee.designation = designation.trim();
    if (department) employee.department = department;
    if (phone !== undefined) employee.phone = phone;
    if (baseSalary) employee.baseSalary = Number(baseSalary);
    if (status) employee.status = status;

    await employee.save();

    await logActivity({
      user: req.user,
      action: "UPDATE_EMPLOYEE",
      module: "Employee Payroll",
      details: `Updated employee profile ${employee.name}`,
    });

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (req, res, next) => {
  try {
    await connectDB();
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      res.status(404);
      throw new Error("Employee profile not found.");
    }

    await Employee.findByIdAndDelete(id);

    await logActivity({
      user: req.user,
      action: "DELETE_EMPLOYEE",
      module: "Employee Payroll",
      details: `Deleted employee profile ${employee.name}`,
    });

    res.status(200).json({ success: true, message: "Employee profile deleted successfully." });
  } catch (error) {
    next(error);
  }
};

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
    employee.advanceBalance += advAmt;
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
