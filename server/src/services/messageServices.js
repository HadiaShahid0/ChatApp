import Message from "../models/messageModal.js";
import Conversation from "../models/conversationModel.js";
import { createOrGetConversationService } from "./conversationServices.js";

export const sendMessageService = async (senderId, receiverId, text, image) => {
  const conversation = await createOrGetConversationService(
    senderId,
    receiverId,
  );

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    text,
    image,
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  return await Message.findById(message._id)
    .populate("sender", "-password")
    .populate("conversation");
};
export const getMessagesService = async (conversationId) => {
  return await Message.find({
    conversation: conversationId,
  })
    .populate("sender", "-password")
    .sort({ createdAt: 1 });
};

export const markMessagesSeenService = async (conversationId, userId) => {
  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: userId },
      seen: false,
    },
    {
      seen: true,
      seenAt: new Date(),
    },
  );

  return await Message.find({
    conversation: conversationId,
  });
};