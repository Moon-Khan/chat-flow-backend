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

    // Broadcast to others that this user is online
    io.emit("user_connected", userId);

    // Send current online users to the new user? 
    // For now simple broadcast is enough, but fetching list might be needed for initial state.
    // Let's send the list to the connecting user.
    socket.emit("online_users", Array.from(onlineUsers.keys()));

    console.log(`🟢 USER CONNECTED: ${socket.id} (${socket.data.user.username})`);

    // User joins a group room (for group chats)
    socket.on("join_room", (room) => {
      socket.join(room);
    });

    socket.on("send_message", async (payload) => {
      try {
        const from = socket.data.user.id;
        const { text, to = null, chat = null, room = null, meta = {} } = payload;

        const saved = await messageService.saveMessage({ from, to, chat, room, text, meta });

        const emitPayload = {
          _id: saved._id,
          from: { _id: from, username: socket.data.user.username },
          text: saved.text, // Decrypted text
          to: saved.to,
          chat: saved.chat,
          room: saved.room,
          meta: saved.meta,
          createdAt: saved.createdAt,
        };

        // Group chat message (using chat ID)
        if (chat) {
          io.emit("receive_message", emitPayload); // For simplicity, broadcast to all. In production, use rooms.
          // Note: In a real app, users would join rooms named by chat._id
        }
        // Legacy room message
        else if (room) {
          io.to(room).emit("receive_message", emitPayload);
        }
        // Private message (User → User)
        else if (to) {
          const receiverId = String(to);
          const receiverSocketId = onlineUsers.get(receiverId);
          const senderSocketId = onlineUsers.get(from);

          if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive_message", emitPayload);
          }
          if (senderSocketId && senderSocketId !== receiverSocketId) {
            io.to(senderSocketId).emit("receive_message", emitPayload);
          }
        }
        else {
          io.emit("receive_message", emitPayload);
        }

      } catch (err) {
        console.error("Error saving message:", err);
        socket.emit("error", { message: "Message could not be saved" });
      }
    });

    socket.on("delete_message", async (payload) => {
      try {
        const userId = socket.data.user.id;
        const { messageId, option } = payload;
        const message = await messageService.deleteMessage(messageId, userId, option);

        if (option === "everyone") {
          const emitPayload = {
            messageId: message._id,
            chat: message.chat,
            to: message.to,
            room: message.room,
            isDeletedEveryone: true,
            text: "This message was deleted"
          };

          if (message.chat) {
            io.emit("message_deleted", emitPayload);
          } else if (message.room) {
            io.to(message.room).emit("message_deleted", emitPayload);
          } else if (message.to) {
            const receiverId = String(message.to);
            const senderId = String(message.from);
            const receiverSocketId = onlineUsers.get(receiverId);
            const senderSocketId = onlineUsers.get(senderId);

            if (receiverSocketId) io.to(receiverSocketId).emit("message_deleted", emitPayload);
            if (senderSocketId && senderSocketId !== receiverSocketId) io.to(senderSocketId).emit("message_deleted", emitPayload);
          } else {
            io.emit("message_deleted", emitPayload);
          }
        }
      } catch (err) {
        console.error("Error deleting message:", err);
        socket.emit("error", { message: err.message });
      }
    });
    // Clean up when user disconnects
    socket.on("disconnect", (reason) => {
      console.log(`🔴 USER DISCONNECTED: ${socket.id} (${socket.data.user.username})`);
      onlineUsers.delete(userId); // Remove user from online users map
      io.emit("user_disconnected", userId);
    });
  });
};
