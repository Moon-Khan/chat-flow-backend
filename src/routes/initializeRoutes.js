import userRoutes from "../modules/user/user_routes.js";
import messageRoutes from "../modules/chat/message_routes.js";

export const initializeRoutes = (app) => {
    
    app.get("/", (req, res) => res.send("✅ Real-time Chat API is running..."));
    app.use("/api/users", userRoutes);
    app.use("/api/messages", messageRoutes);
};
