import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    verificationCode: { type: String, required: true },
    verificationCodeExpiresAt: { type: Date, required: true },
    pendingExpiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 30 * 60 * 1000) }
  },
  { timestamps: true }
);

pendingUserSchema.index({ pendingExpiresAt: 1 }, { expireAfterSeconds: 0 });

const PendingUser = mongoose.model("PendingUser", pendingUserSchema);
export default PendingUser;
