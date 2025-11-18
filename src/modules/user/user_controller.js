import * as userService from "./user_service.js";
import { signToken } from "../../utils/token.js";

export const register = async (req, res) => {
    try{
        const { username, email, password } = req.body;
        const user = await userService.createUser({ username, email, password });
        console.log("------>",user);
        const token = signToken(user.toObject());
        res.status(201).json({ user: { id: user._id, username: user.username, email: user.email }, token });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}

export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await userService.findUserByEmail(email);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
  
      const ok = await userService.comparePassword(password, user.password);
      if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  
      const token = signToken({ id: user._id });
      res.json({ user: { id: user._id, username: user.username, email: user.email }, token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

export const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};