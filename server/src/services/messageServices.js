import Message from "../models/messageModal.js";
import Conversation from "../models/conversationModel.js";
import { createOrGetConversationService } from "./conversationServices.js";

export const sendMessageService = async (
  senderId,
  receiverId,
  text
) => {
  // Get existing conversation or create a new one
  const conversation = await createOrGetConversationService(
    senderId,
    receiverId
  );

  // Create message
  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    text,
  });

  // Update last message
  conversation.lastMessage = message._id;
  await conversation.save();

  // Return populated message
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

export const markMessagesSeenService = async (
  conversationId,
  userId
) => {
  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: userId },
      seen: false,
    },
    {
      seen: true,
      seenAt: new Date(),
    }
  );

  return await Message.find({
    conversation: conversationId,
  });
};