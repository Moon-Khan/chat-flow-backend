import User from "./user_model.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const createUser = async ({ username, email, password }) => {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) throw new Error("User already exists");
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ username, email, password: hashed });
  return user;
};

export const findUserByEmail = (email) => User.findOne({ email });
export const findUserById = (id) => User.findById(id);
export const comparePassword = (plain, hashed) => bcrypt.compare(plain, hashed);

export const getAllUsers = (excludeId) => {
  const query = excludeId ? { _id: { $ne: excludeId } } : {};
  return User.find(query, { password: 0 }).sort({ createdAt: -1 });
};

export const updateUserProfile = (userId, updates) => {
  return User.findByIdAndUpdate(userId, updates, { new: true, select: "-password" });
};

const userService = {
  createUser,
  findUserByEmail,
  comparePassword,
  getAllUsers,
  findUserById,
  updateUserProfile
};

export default userService;
