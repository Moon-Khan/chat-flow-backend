import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  avatarUrl: { type: String },
  about: { type: String, default: "" },
  storyPrivacy: { type: String, enum: ['everyone', 'selected'], default: 'everyone' },
  storyAllowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  statusPrivacy: { type: String, enum: ['everyone', 'selected', 'nobody'], default: 'everyone' },
  statusAllowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
