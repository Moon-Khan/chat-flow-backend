import * as userService from "./user_service.js";
import { signToken } from "../../utils/token.js";
import { sendResponse } from "../../utils/response.js";
import { sendVerificationEmail } from "../../utils/mailer.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    const user = await userService.createUser({
      username,
      email,
      password
    });

    // Save verification info
    user.verificationCode = verificationCode;
    user.verificationCodeExpiresAt = verificationCodeExpiresAt;
    await user.save();

    // Send email
    await sendVerificationEmail(email, verificationCode);

    return sendResponse(res, 201, true, "Verification code sent to email", {
      email: user.email
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

    if (!user.isVerified) {
      return sendResponse(res, 403, false, "Please verify your email first", {
        email: user.email,
        notVerified: true
      });
    }

    const ok = await userService.comparePassword(password, user.password);
    if (!ok) {
      return sendResponse(res, 401, false, "Invalid credentials");
    }

    const token = signToken({ id: user._id });

    return sendResponse(res, 200, true, "Login successful", {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        about: user.about,
        storyPrivacy: user.storyPrivacy,
        storyAllowedUsers: user.storyAllowedUsers,
        statusPrivacy: user.statusPrivacy,
        statusAllowedUsers: user.statusAllowedUsers
      },
      token
    });
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await userService.findUserByEmail(email);

    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    if (user.isVerified) {
      return sendResponse(res, 400, false, "Email already verified");
    }

    if (user.verificationCode !== code) {
      return sendResponse(res, 400, false, "Invalid verification code");
    }

    if (new Date() > user.verificationCodeExpiresAt) {
      return sendResponse(res, 400, false, "Verification code expired");
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save();

    const token = signToken({ id: user._id });

    return sendResponse(res, 200, true, "Email verified successfully", {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        about: user.about
      },
      token
    });
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

export const resendCode = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userService.findUserByEmail(email);

    if (!user) {
      return sendResponse(res, 404, false, "User not found");
    }

    if (user.isVerified) {
      return sendResponse(res, 400, false, "Email already verified");
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpiresAt = verificationCodeExpiresAt;
    await user.save();

    await sendVerificationEmail(email, verificationCode);

    return sendResponse(res, 200, true, "Verification code resent");
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await userService.deleteUserById(userId);
    return sendResponse(res, 200, true, "Account deleted successfully");
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
    const { about, avatarUrl, storyPrivacy, storyAllowedUsers, statusPrivacy, statusAllowedUsers } = req.body;

    const updates = {};
    if (about !== undefined) updates.about = about;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
    if (storyPrivacy !== undefined) updates.storyPrivacy = storyPrivacy;
    if (storyAllowedUsers !== undefined) updates.storyAllowedUsers = storyAllowedUsers;
    if (statusPrivacy !== undefined) updates.statusPrivacy = statusPrivacy;
    if (statusAllowedUsers !== undefined) updates.statusAllowedUsers = statusAllowedUsers;

    const user = await userService.updateUserProfile(userId, updates);
    return sendResponse(res, 200, true, "Profile updated successfully", {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        about: user.about,
        storyPrivacy: user.storyPrivacy,
        storyAllowedUsers: user.storyAllowedUsers,
        statusPrivacy: user.statusPrivacy,
        statusAllowedUsers: user.statusAllowedUsers
      }
    });
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};