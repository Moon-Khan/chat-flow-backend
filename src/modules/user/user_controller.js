import * as userService from "./user_service.js";
import { signToken } from "../../utils/token.js";
import { sendResponse } from "../../utils/response.js";
import { sendVerificationEmail } from "../../utils/mailer.js";
import PendingUser from "./pending_user_model.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUsername = String(username || "").trim();

    const existingEmail = await userService.findUserByEmail(normalizedEmail);
    const existingUsername = await userService.findUserByUsername(normalizedUsername);
    if (existingEmail || existingUsername) {
      return sendResponse(res, 400, false, "User already exists");
    }

    const pendingByUsername = await PendingUser.findOne({ username: normalizedUsername });
    if (pendingByUsername && pendingByUsername.email !== normalizedEmail) {
      return sendResponse(res, 400, false, "Username already in use");
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    const hashedPassword = await userService.hashPassword(password);

    // Save pending signup. User account is only created after verify-email.
    await PendingUser.findOneAndUpdate(
      { email: normalizedEmail },
      {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash: hashedPassword,
        verificationCode,
        verificationCodeExpiresAt,
        pendingExpiresAt: new Date(Date.now() + 30 * 60 * 1000)
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send email
    const emailSent = await sendVerificationEmail(normalizedEmail, verificationCode);
    if (!emailSent) {
      return sendResponse(res, 500, false, "Failed to send verification email. Please try again.");
    }

    return sendResponse(res, 201, true, "Verification code sent to email", {
      email: normalizedEmail
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
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const existingUser = await userService.findUserByEmail(normalizedEmail);

    if (existingUser?.isVerified) {
      return sendResponse(res, 400, false, "Email already verified");
    }

    const pendingUser = await PendingUser.findOne({ email: normalizedEmail });
    if (!pendingUser) {
      return sendResponse(res, 404, false, "No pending verification found. Please register again.");
    }

    if (pendingUser.verificationCode !== code) {
      return sendResponse(res, 400, false, "Invalid verification code");
    }

    if (new Date() > pendingUser.verificationCodeExpiresAt) {
      return sendResponse(res, 400, false, "Verification code expired");
    }

    const usernameTaken = await userService.findUserByUsername(pendingUser.username);
    if (usernameTaken) {
      await PendingUser.deleteOne({ _id: pendingUser._id });
      return sendResponse(res, 400, false, "Username already in use. Please register again.");
    }

    const user = await userService.createVerifiedUserWithHashedPassword({
      username: pendingUser.username,
      email: pendingUser.email,
      passwordHash: pendingUser.passwordHash
    });
    await PendingUser.deleteOne({ _id: pendingUser._id });

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
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const existingUser = await userService.findUserByEmail(normalizedEmail);

    if (existingUser?.isVerified) {
      return sendResponse(res, 400, false, "Email already verified");
    }

    const pendingUser = await PendingUser.findOne({ email: normalizedEmail });
    if (!pendingUser) {
      return sendResponse(res, 404, false, "No pending verification found. Please register again.");
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

    pendingUser.verificationCode = verificationCode;
    pendingUser.verificationCodeExpiresAt = verificationCodeExpiresAt;
    pendingUser.pendingExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await pendingUser.save();

    const emailSent = await sendVerificationEmail(normalizedEmail, verificationCode);
    if (!emailSent) {
      return sendResponse(res, 500, false, "Failed to resend verification code email");
    }

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
