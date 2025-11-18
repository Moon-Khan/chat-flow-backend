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

export const getAllUsers = () => User.find({}, { password: 0 }).sort({ createdAt: -1 });

const userService = {
  createUser,
  findUserByEmail,
  comparePassword,
  getAllUsers,
};

export default userService;
