import Message from "./message_model.js";
import Chat from "./chat_model.js";
import mongoose from "mongoose";
import crypto from "crypto";

// Encryption setup
const algorithm = "aes-256-cbc";
const secret = process.env.JWT_SECRET;
const key = crypto.createHash("sha256").update(String(secret)).digest("base64").substr(0, 32);
const ivLength = 16;

const encrypt = (text) => {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const decrypt = (text) => {
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    return text; // Return original if decryption fails (backward compatibility)
  }
};

export const saveMessage = async ({ from, to, chat, room, text, meta }) => {
  const encryptedText = encrypt(text);
  const msgData = { from, text: encryptedText, meta };
  if (to) msgData.to = to;
  if (chat) msgData.chat = chat;
  if (room) msgData.room = room;

  const msg = await Message.create(msgData);

  // Update lastMessage in Chat if it's a group chat
  if (chat) {
    await Chat.findByIdAndUpdate(chat, { lastMessage: msg._id });
  }

  return { ...msg.toObject(), text: text }; // Return decrypted for immediate UI use
};

export const getMessagesForRoom = async (room, userId, limit = 50) => {
  const query = { room };
  if (userId) {
    query.deletedBy = { $ne: userId };
  }
  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("from", "username email avatarUrl")
    .lean();

  return messages.map(msg => ({ ...msg, text: decrypt(msg.text) })).reverse();
};

export const getMessagesForChat = async (chatId, userId, limit = 100) => {
  const query = { chat: chatId };
  if (userId) {
    query.deletedBy = { $ne: userId };
  }
  const messages = await Message.find(query)
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate("from", "username email avatarUrl")
    .lean();

  return messages.map(msg => ({ ...msg, text: decrypt(msg.text) }));
};

export const getMessagesBetweenUsers = async (userA, userB, limit = 200) => {
  const messages = await Message.find({
    $or: [
      { from: userA, to: userB },
      { from: userB, to: userA }
    ],
    deletedBy: { $ne: userA }
  }).sort({ createdAt: 1 }).limit(limit).populate("from", "username email avatarUrl").lean();

  return messages.map(msg => ({ ...msg, text: decrypt(msg.text) }));
};

export const createGroupChat = async ({ name, participants, admin }) => {
  const chat = await Chat.create({
    name,
    participants: [...new Set([...participants, admin])],
    admin
  });
  return chat;
};

export const getConversations = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(String(userId));

  // 1. Get 1:1 conversations from Messages
  const rawPrivateConversations = await Message.aggregate([
    {
      $match: {
        chat: { $exists: false },
        $or: [{ from: userObjectId }, { to: userObjectId }]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$from", userObjectId] },
            "$to",
            "$from"
          ]
        },
        lastMessage: { $first: "$$ROOT" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $project: {
        _id: 0,
        type: { $literal: "private" },
        user: { _id: 1, username: 1, email: 1, avatarUrl: 1, about: 1 },
        lastMessage: {
          text: "$lastMessage.text",
          createdAt: "$lastMessage.createdAt",
          isOwn: { $eq: ["$lastMessage.from", userObjectId] }
        }
      }
    }
  ]);

  // 2. Get Group conversations from Chat model
  const groupConversations = await Chat.find({ participants: userObjectId })
    .populate("lastMessage")
    .populate("participants", "username email avatarUrl about")
    .lean();

  const formattedGroups = groupConversations.map(group => ({
    type: "group",
    _id: group._id,
    name: group.name,
    participants: group.participants,
    avatarUrl: group.avatarUrl, // Group might have avatar later
    admin: group.admin,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    lastMessage: group.lastMessage ? {
      text: decrypt(group.lastMessage.text),
      createdAt: group.lastMessage.createdAt,
      isOwn: String(group.lastMessage.from) === String(userId)
    } : null
  }));

  // 3. Merge and Sort
  const allConversations = [
    ...rawPrivateConversations.map(conv => ({
      ...conv,
      lastMessage: {
        ...conv.lastMessage,
        text: decrypt(conv.lastMessage.text)
      }
    })),
    ...formattedGroups
  ];

  return allConversations.sort((a, b) => {
    const getSortDate = (conv) => {
      if (conv.lastMessage?.createdAt) return new Date(conv.lastMessage.createdAt);
      // For new groups or chats without messages, use the chat's own timestamp
      return new Date(conv.createdAt || conv.updatedAt || 0);
    };

    return getSortDate(b) - getSortDate(a);
  });
};

export const deleteMessage = async (messageId, userId, option) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error("Message not found");

  if (option === "everyone") {
    if (String(message.from) !== String(userId)) {
      throw new Error("You can only delete your own messages for everyone");
    }
    message.isDeletedEveryone = true;
    message.text = encrypt("This message was deleted");
    message.meta = {}; // Clear images etc.
    await message.save();
  } else {
    // Delete for me
    if (!message.deletedBy.includes(userId)) {
      message.deletedBy.push(userId);
      await message.save();
    }
  }

  return message;
};

const messageService = {
  saveMessage,
  getMessagesForRoom,
  getMessagesForChat,
  getMessagesBetweenUsers,
  createGroupChat,
  getConversations,
  deleteMessage
};
export default messageService;
