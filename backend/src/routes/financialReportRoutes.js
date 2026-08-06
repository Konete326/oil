import express from "express";
import { getTrialBalance, getDetailedPartyLedger } from "../controllers/financialReportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/trial-balance", protect, getTrialBalance);
router.get("/party-ledger", protect, getDetailedPartyLedger);

export default router;
