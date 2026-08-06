import express from "express";
import {
  getSalesReport,
  getPurchases,
  createPurchase,
  getPartySalesRecord,
} from "../controllers/salesReportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/sales", protect, getSalesReport);
router.route("/purchases").get(protect, getPurchases).post(protect, createPurchase);
router.get("/party-sales", protect, getPartySalesRecord);

export default router;
