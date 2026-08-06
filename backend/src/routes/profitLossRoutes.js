import express from "express";
import { getProfitLossSummary } from "../controllers/profitLossController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getProfitLossSummary);

export default router;
