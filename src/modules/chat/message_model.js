import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional for 1:1
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, // reference to group chat
  room: { type: String },
  text: { type: String, required: true },
  meta: { type: Object, default: {} }, // optional metadata
  deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isDeletedEveryone: { type: Boolean, default: false },
  attachments: [{
    url: String,
    filename: String,
    mimetype: String,
    size: Number
  }],
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;
