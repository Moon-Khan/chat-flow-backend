import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    name: { type: String, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isGroup: { type: Boolean, default: true },
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
