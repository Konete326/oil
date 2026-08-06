import express from "express";
import { getLedgerEntries, createPaymentEntry, getAgingReport } from "../controllers/ledgerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getLedgerEntries);
router.post("/payment", protect, createPaymentEntry);
router.get("/aging", protect, getAgingReport);

export default router;
