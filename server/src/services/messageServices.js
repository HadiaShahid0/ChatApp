import Message from "../models/messageModal.js";
import Conversation from "../models/conversationModel.js";
import { createOrGetConversationService } from "./conversationServices.js";

export const sendMessageService = async (
  senderId,
  receiverId,
  text,
  image,
  groupId = null,
) => {
  let conversation;

  if (groupId) {
    conversation = await Conversation.findById(groupId);

    if (!conversation) {
      throw new Error("Group not found.");
    }

    if (!conversation.isGroup) {
      throw new Error("Conversation is not a group.");
    }
  } else {
    conversation = await createOrGetConversationService(senderId, receiverId);
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    text,
    image,

    // Sender has already received and seen their own message
    deliveredTo: [senderId],
    seenBy: [senderId],
  });
const totalMembers = conversation.participants.filter(
  (id) => id.toString() !== senderId.toString()
).length;


const populatedMessage = await Message.findById(message._id)
.populate("sender", "-password")
.populate({
 path:"conversation",
 populate:{
   path:"participants",
   select:"name profileImage status"
 }
});

  conversation.lastMessage = message._id;
  await conversation.save();

  return {
 ...populatedMessage.toObject(),
 totalMembers,
};
};

export const getMessagesService = async (conversationId) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  return await Message.find({
    conversation: conversationId,
  })
    .populate("sender", "-password")
    .populate({
      path: "conversation",
      populate: [
        {
          path: "participants",
          select: "name profileImage status",
        },
        {
          path: "admin",
          select: "name profileImage",
        },
      ],
    })
    .sort({ createdAt: 1 });
};

export const markMessagesSeenService = async (conversationId, userId) => {
  const messages = await Message.find({
    conversation: conversationId,
    sender: { $ne: userId },
  });

  for (const message of messages) {
    // Delivered
    if (!message.deliveredTo.includes(userId)) {
      message.deliveredTo.push(userId);
    }

    if (!message.seenBy.includes(userId)) {
      message.seenBy.push(userId);
    }

    await message.save();
  }

  return await Message.find({
    conversation: conversationId,
  })
    .populate("sender", "-password")
    .populate({
      path: "conversation",
      populate: [
        {
          path: "participants",
          select: "name profileImage status",
        },
        {
          path: "admin",
          select: "name profileImage",
        },
      ],
    });
};
