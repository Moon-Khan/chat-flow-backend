import "./config/env.js";  // must be before any other imports

import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import { setupSocket } from "./sockets/socketHandler.js";
import express from "express";
import cors from "cors";
import { initializeRoutes } from "./routes/initializeRoutes.js";


console.log("Secret:", process.env.JWT_SECRET);

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));


connectDB();

const PORT = process.env.PORT;
console.log("======> PORT", PORT);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

// Setup socket events
setupSocket(io);
initializeRoutes(app);


server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
