import messageService from "./message_service.js";
import { sendResponse } from "../../utils/response.js";

export const getRoomMessages = async (req, res) => {
  try {
    const { room } = req.params;
    const userId = req.user.id;
    const messages = await messageService.getMessagesForRoom(room, userId);
    return sendResponse(res, 200, true, "Room messages fetched successfully", messages);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const messages = await messageService.getMessagesForChat(chatId, userId);
    return sendResponse(res, 200, true, "Chat messages fetched successfully", messages);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

export const getPrivateMessages = async (req, res) => {
  try {
    const userA = req.user.id; // from auth middleware
    const userB = req.params.userId;

    const messages = await messageService.getMessagesBetweenUsers(userA, userB);
    return sendResponse(res, 200, true, "Private messages fetched successfully", messages);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await messageService.getConversations(userId);
    return sendResponse(res, 200, true, "Conversations fetched successfully", conversations);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name, participants } = req.body;
    const admin = req.user.id;
    const chat = await messageService.createGroupChat({ name, participants, admin });
    return sendResponse(res, 201, true, "Group chat created successfully", chat);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};
export const leaveGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const chat = await messageService.leaveGroupChat(chatId, userId);
    return sendResponse(res, 200, true, "Left group successfully", chat);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      if (req.file) {
        // Handle single file upload (backward compatibility)
        const imageUrl = `/uploads/${req.file.filename}`;
        return sendResponse(res, 200, true, "Image uploaded successfully", { imageUrl, urls: [imageUrl] });
      }
      return sendResponse(res, 400, false, "No files uploaded");
    }

    const filesData = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    }));

    const urls = filesData.map(f => f.url);

    return sendResponse(res, 200, true, "Files uploaded successfully", {
      files: filesData,
      urls, // backward compatibility
      imageUrl: urls[0] // backward compatibility
    });
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { option } = req.body; // 'me' or 'everyone'
    const userId = req.user.id;

    const message = await messageService.deleteMessage(messageId, userId, option);
    return sendResponse(res, 200, true, `Message deleted for ${option}`, message);
  } catch (err) {
    return sendResponse(res, 500, false, err.message);
  }
};
