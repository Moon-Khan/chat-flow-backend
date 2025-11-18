import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  from:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  to:      { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional for 1:1
  room:    { type: String },
  text:    { type: String, required: true },
  meta:    { type: Object, default: {} }, // optional metadata
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;
