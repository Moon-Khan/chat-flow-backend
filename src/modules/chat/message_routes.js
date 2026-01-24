import express from "express";
import { getRoomMessages, getPrivateMessages, getConversations, createGroup, getChatMessages, leaveGroup, uploadImage, deleteMessage } from "./message_controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import upload from "../../middlewares/upload.js";

const router = express.Router();

router.get("/conversations", authMiddleware, getConversations);
router.get("/room/:room", authMiddleware, getRoomMessages);
router.get("/chat/:chatId", authMiddleware, getChatMessages);
router.get("/private/:userId", authMiddleware, getPrivateMessages);
router.post("/groups", authMiddleware, createGroup);
router.post("/groups/:chatId/leave", authMiddleware, leaveGroup);
router.post("/upload", authMiddleware, upload.array("files", 10), uploadImage);
router.post("/:messageId/delete", authMiddleware, deleteMessage);

export default router;
