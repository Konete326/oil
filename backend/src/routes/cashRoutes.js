import express from "express";
import {
  getCashTransactions,
  createCashTransaction,
  getPartyCashSummary,
  deleteCashTransaction,
} from "../controllers/cashController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getCashTransactions).post(protect, createCashTransaction);
router.get("/party-summary", protect, getPartyCashSummary);
router.delete("/:id", protect, deleteCashTransaction);

export default router;
