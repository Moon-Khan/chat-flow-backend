import { verifyToken } from "../utils/token.js";
import userService from "../modules/user/user_service.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

    const token = header.split(" ")[1];
    const decoded = verifyToken(token);
    if (!decoded?.id) return res.status(401).json({ error: "Invalid token" });

    const user = await userService.findUserById(decoded.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = { id: user._id, username: user.username, email: user.email };
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

