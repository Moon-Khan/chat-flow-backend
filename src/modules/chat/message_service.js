import Message from "./message_model.js";

export const saveMessage = async ({ from, to, room, text, meta }) => {
  const msg = await Message.create({ from, to, room, text, meta });
  return msg;
};

export const getMessagesForRoom = (room, limit = 50) => {
  return Message.find({ room })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("from", "username email")
    .lean();
};

export const getMessagesBetweenUsers = (userA, userB, limit = 200) => {
  return Message.find({
    $or: [
      { from: userA, to: userB },
      { from: userB, to: userA }
    ]
  }).sort({ createdAt: 1 }).limit(limit).populate("from", "username email").lean();
};

const messageService = {
  saveMessage,
  getMessagesForRoom,
  getMessagesBetweenUsers
};
export default messageService;