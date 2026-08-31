import express from "express";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";
import {
  recordEmployeeAdvance,
  getEmployeeAdvances,
} from "../controllers/employeeAdvanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getEmployees).post(protect, createEmployee);
router.route("/advance").get(protect, getEmployeeAdvances).post(protect, recordEmployeeAdvance);
router.route("/:id").put(protect, updateEmployee).delete(protect, deleteEmployee);

export default router;
