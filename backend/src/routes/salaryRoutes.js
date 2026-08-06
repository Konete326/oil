import express from "express";
import { getSalaryVouchers, generateSalaryVoucher } from "../controllers/salaryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getSalaryVouchers).post(protect, generateSalaryVoucher);

export default router;
