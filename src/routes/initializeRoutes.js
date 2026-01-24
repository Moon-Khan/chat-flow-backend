import userRoutes from "../modules/user/user_routes.js";
import messageRoutes from "../modules/chat/message_routes.js";
import storyRoutes from "../modules/story/story_routes.js";
import { sendResponse } from "../utils/response.js";

export const initializeRoutes = (app) => {

    app.get("/", (req, res) => sendResponse(res, 200, true, "Real-time Chat API is running..."));
    app.use("/api/users", userRoutes);
    app.use("/api/messages", messageRoutes);
    app.use("/api/stories", storyRoutes);
};
