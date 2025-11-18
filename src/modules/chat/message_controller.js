import messageService from "./message_service.js";

export const getRoomMessages = async (req, res) => {
  const { room } = req.params;
  const messages = await messageService.getMessagesForRoom(room);
  res.json(messages);
};

export const getPrivateMessages = async (req, res) => {
  const userA = req.user.id; // from auth middleware
  const userB = req.params.userId;

  const messages = await messageService.getMessagesBetweenUsers(userA, userB);
  res.json(messages);
};
