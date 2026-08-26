import express from "express";
import { syncBatchOfflineData, getHydrateData } from "../controllers/syncController.js";

const router = express.Router();

router.post("/batch", syncBatchOfflineData);
router.get("/hydrate", getHydrateData);

export default router;
