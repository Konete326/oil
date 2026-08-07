import express from "express";
import { eraseAllData, eraseModuleData } from "../controllers/dataResetController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/erase-all", eraseAllData);
router.post("/erase-module", eraseModuleData);

export default router;
