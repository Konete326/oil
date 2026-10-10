import express from "express";
import { getLedgerEntries, createPaymentEntry, getAgingReport, updateLedgerEntry, createLedgerEntry, deleteLedgerEntry } from "../controllers/ledgerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getLedgerEntries);
router.post("/", protect, createLedgerEntry);
router.post("/payment", protect, createPaymentEntry);
router.put("/:id", protect, updateLedgerEntry);
router.delete("/:id", protect, deleteLedgerEntry);
router.get("/aging", protect, getAgingReport);

export default router;
