import express from "express";
import { getRoomMessages, getPrivateMessages } from "./message_controller.js";
import { authMiddleware } from "../../middlewares/auth.js";

const router = express.Router();

router.get("/room/:room", authMiddleware, getRoomMessages);
router.get("/private/:userId", authMiddleware, getPrivateMessages);

export default router;
