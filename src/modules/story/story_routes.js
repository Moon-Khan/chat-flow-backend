import express from "express";
import { authMiddleware } from "../../middlewares/auth.js";
import { uploadStory, getStories, viewStory, deleteStory } from "./story_controller.js";
import upload from "../../middlewares/upload.js"; // Reuse existing upload middleware

const router = express.Router();

router.post("/", authMiddleware, upload.array("files", 10), uploadStory); // Allow up to 10 files
router.get("/", authMiddleware, getStories);
router.post("/:id/view", authMiddleware, viewStory);
router.delete("/:id", authMiddleware, deleteStory);

export default router;
