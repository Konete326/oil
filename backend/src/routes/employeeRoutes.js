import express from "express";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";
import {
  recordEmployeeAdvance,
  getEmployeeAdvanceLedger,
  deleteEmployeeAdvance,
} from "../controllers/employeeAdvanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getEmployees).post(protect, createEmployee);
router.get("/advance/ledger", protect, getEmployeeAdvanceLedger);
router.post("/advance", protect, recordEmployeeAdvance);
router.delete("/advance/:id", protect, deleteEmployeeAdvance);
router.route("/:id").put(protect, updateEmployee).delete(protect, deleteEmployee);

export default router;
