import express from "express";
import { uploadImage, getMediaList, deleteMedia } from "../controllers/mediaController.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/upload", upload.single("image"), uploadImage);
router.get("/", getMediaList);
router.delete("/:id", deleteMedia);

export default router;
