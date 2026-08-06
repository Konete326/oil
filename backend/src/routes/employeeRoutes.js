import express from "express";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  recordEmployeeAdvance,
} from "../controllers/employeeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getEmployees).post(protect, createEmployee);
router.route("/:id").put(protect, updateEmployee).delete(protect, deleteEmployee);
router.post("/advance", protect, recordEmployeeAdvance);

export default router;
