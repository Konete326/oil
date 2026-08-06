import express from "express";
import { getDashboardData, createInvoice } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", getDashboardData);
router.post("/invoices", createInvoice);

export default router;
