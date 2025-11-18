import { verifyToken } from "../utils/token.js";
import messageService from "../modules/chat/message_service.js";
import userService from "../modules/user/user_service.js";


// Keep track of all online users (userId → socketId)
const onlineUsers = new Map();


export const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication error: token required"));

      const decoded = verifyToken(token);
      const user = await userService.findUserById(decoded.id);
      if (!user) return next(new Error("Authentication error: user not found"));

      socket.data.user = { id: user._id.toString(), username: user.username };
      next();
    } catch (err) {
      console.error("Socket auth error:", err.message || err);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.user.id;
    onlineUsers.set(userId, socket.id); // ✅ store connected user

    console.log(`🟢 USER CONNECTED: ${socket.id} (${socket.data.user.username})`);

    // User joins a group room (for group chats)
    socket.on("join_room", (room) => {
      socket.join(room);
    });

    socket.on("send_message", async (payload) => {
      try {
        const from = socket.data.user.id;
        const { text, to = null, room = null, meta = {} } = payload;

        const saved = await messageService.saveMessage({ from, to, room, text, meta });

        const emitPayload = {
          id: saved._id,
          from,
          text: saved.text,
          to: saved.to,
          room: saved.room,
          meta: saved.meta,
          createdAt: saved.createdAt,
        };

        //  Group room message
        if (room) {
          io.to(room).emit("receive_message", emitPayload);
        }
        //  Private message (User → User)
        else if (to) {
          const receiverId = String(to); // Ensure consistent string format
          const receiverSocketId = onlineUsers.get(receiverId);
          const senderSocketId = onlineUsers.get(from);

          if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive_message", emitPayload);
          }
          // Also send back to sender (so their own chat updates)
          if (senderSocketId) {
            io.to(senderSocketId).emit("receive_message", emitPayload);
          }
        }
        //  Public broadcast (fallback)
        else {
          io.emit("receive_message", emitPayload);
        }

      } catch (err) {
        console.error("Error saving message:", err);
        socket.emit("error", { message: "Message could not be saved" });
      }
    });
    // Clean up when user disconnects
    socket.on("disconnect", (reason) => {
      console.log(`🔴 USER DISCONNECTED: ${socket.id} (${socket.data.user.username})`);
      onlineUsers.delete(userId); // Remove user from online users map
    });
  });
};
