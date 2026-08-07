import express from "express";
import {
  getNotifications,
  markAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.put("/read/:id", markAsRead);
router.delete("/clear-all", clearAllNotifications);
router.delete("/:id", deleteNotification);

export default router;
