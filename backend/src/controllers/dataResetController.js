import { User } from "../models/userModel.js";
import { Product } from "../models/productModel.js";
import { Category } from "../models/categoryModel.js";
import { PosSale } from "../models/posSaleModel.js";
import { Mill } from "../models/millModel.js";
import { Challan } from "../models/challanModel.js";
import { Ledger } from "../models/ledgerModel.js";
import { Supplier } from "../models/supplierModel.js";
import { SupplierLedger } from "../models/supplierLedgerModel.js";
import { CashTransaction } from "../models/cashModel.js";
import { Expense } from "../models/expenseModel.js";
import { SalaryVoucher } from "../models/salaryVoucherModel.js";
import { Employee } from "../models/employeeModel.js";
import { AuditLog } from "../models/auditModel.js";
import { Notification } from "../models/notificationModel.js";
import { SystemLog } from "../models/systemLogModel.js";

const verifyAdminPassword = async (userId, password) => {
  const user = await User.findById(userId);
  if (!user || user.role !== "admin") return false;
  return await user.matchPassword(password);
};

export const eraseAllData = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      res.status(400);
      throw new Error("Admin security password is required to confirm full data erasure.");
    }
    const isValid = await verifyAdminPassword(req.user._id, password);
    if (!isValid) {
      res.status(401);
      throw new Error("Invalid admin password. Data reset aborted.");
    }
    await Promise.all([
      Product.deleteMany({}), Category.deleteMany({}), PosSale.deleteMany({}),
      Mill.deleteMany({}), Challan.deleteMany({}),
      Ledger.deleteMany({}), Supplier.deleteMany({}), SupplierLedger.deleteMany({}),
      CashTransaction.deleteMany({}), Expense.deleteMany({}), SalaryVoucher.deleteMany({}),
      Employee.deleteMany({}), AuditLog.deleteMany({}), Notification.deleteMany({}),
      SystemLog.deleteMany({})
    ]);
    await Notification.create({
      title: "Full System Data Reset Executed",
      message: `System database was completely reset by ${req.user.name}. Admin login credentials preserved.`,
      type: "danger",
      userName: req.user.name,
      targetRoles: ["admin"],
    });
    res.status(200).json({
      success: true,
      message: "All application data has been permanently erased. Admin user account remains intact.",
    });
  } catch (error) {
    next(error);
  }
};

export const eraseModuleData = async (req, res, next) => {
  try {
    const { password, moduleKey } = req.body;
    if (!password || !moduleKey) {
      res.status(400);
      throw new Error("Admin password and target moduleKey are required.");
    }
    const isValid = await verifyAdminPassword(req.user._id, password);
    if (!isValid) {
      res.status(401);
      throw new Error("Invalid admin password. Module erasure aborted.");
    }
    let deletedMessage = "";
    switch (moduleKey) {
      case "products":
        await Promise.all([Product.deleteMany({}), Category.deleteMany({})]);
        deletedMessage = "All Products & Categories stock data erased.";
        break;
      case "sales":
        await Promise.all([PosSale.deleteMany({}), Challan.deleteMany({})]);
        deletedMessage = "All POS Sales & Delivery Challans erased.";
        break;
      case "ledgers":
        await Promise.all([Ledger.deleteMany({}), SupplierLedger.deleteMany({}), Supplier.deleteMany({})]);
        deletedMessage = "All Khatas & Customer/Supplier Ledgers erased.";
        break;
      case "cash":
        await CashTransaction.deleteMany({});
        deletedMessage = "All Cash Register Transactions erased.";
        break;
      case "expenses":
        await Expense.deleteMany({});
        deletedMessage = "All Expense Vouchers erased.";
        break;
      case "payroll":
        await Promise.all([SalaryVoucher.deleteMany({}), Employee.deleteMany({})]);
        deletedMessage = "All Employee Payroll & Advance records erased.";
        break;
      case "textile":
        await Mill.deleteMany({});
        deletedMessage = "All Textile Mill profiles erased.";
        break;
      default:
        res.status(400);
        throw new Error("Invalid moduleKey specified.");
    }
    res.status(200).json({
      success: true,
      message: deletedMessage,
    });
  } catch (error) {
    next(error);
  }
};
