import express from "express";
import { register, login, getAllUsers, updateProfile } from "./user_controller.js";
import { authMiddleware } from "../../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/", authMiddleware, getAllUsers);
router.put("/profile", authMiddleware, updateProfile);

export default router;
