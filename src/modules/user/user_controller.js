import * as userService from "./user_service.js";
import { signToken } from "../../utils/token.js";
import { sendResponse } from "../../utils/response.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await userService.createUser({ username, email, password });
    const token = signToken(user.toObject());

    return sendResponse(res, 201, true, "User registered successfully", {
      user: { id: user._id, username: user.username, email: user.email },
      token
    });
  }
  catch (err) {
    return sendResponse(res, 400, false, err.message);
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }

    const ok = await userService.comparePassword(password, user.password);
    if (!ok) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }

    const token = signToken({ id: user._id });

    return sendResponse(res, 200, true, "Login successful", {
      user: { id: user._id, username: user.username, email: user.email, avatarUrl: user.avatarUrl, about: user.about },
      token
    });
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    // content of userService.getAllUsers() fetches all, we might need to change service or filter here. 
    // Best to pass ID to service.
    const users = await userService.getAllUsers(currentUserId);
    return sendResponse(res, 200, true, "Users fetched successfully", users);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { about, avatarUrl, storyPrivacy, storyAllowedUsers } = req.body;

    const updates = {};
    if (about !== undefined) updates.about = about;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (storyPrivacy !== undefined) updates.storyPrivacy = storyPrivacy;
    if (storyAllowedUsers !== undefined) updates.storyAllowedUsers = storyAllowedUsers;

    const user = await userService.updateUserProfile(userId, updates);
    return sendResponse(res, 200, true, "Profile updated successfully", {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        about: user.about,
        storyPrivacy: user.storyPrivacy,
        storyAllowedUsers: user.storyAllowedUsers
      }
    });
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};