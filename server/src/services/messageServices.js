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
    deliveredTo: [senderId],
    seenBy: [senderId],
  });
  console.log("MESSAGE FROM SERVICE:", message);

  const totalMembers = conversation.participants.filter(
    (id) => id.toString() !== senderId.toString(),
  ).length;

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "-password")
    .populate({
      path: "conversation",
      populate: {
        path: "participants",
        select: "name profileImage status",
      },
    });

  conversation.lastMessage = message._id;
  await conversation.save();

  return {
    ...populatedMessage.toObject(),
    totalMembers,
  };
};

export const getMessagesService = async (
  conversationId,
  limit = 20,
  before = null,
) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const query = {
    conversation: conversationId,
  };

  // If before is provided,
  // get messages older than that message
  if (before) {
    query._id = { $lt: before };
  }

  const messages = await Message.find(query)
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
    .sort({ _id: -1 })
    .limit(Number(limit));

  // We fetched newest → oldest,
  messages.reverse();

  // If we received less than the limit,
  const hasMore = messages.length === Number(limit);

  return {
    messages,
    hasMore,
  };
};

export const markMessagesSeenService = async (
  conversationId,
  userId,
) => {
  const messages = await Message.find({
    conversation: conversationId,
    sender: { $ne: userId },
    seenBy: { $ne: userId },
  });

  if (!messages.length) {
    return [];
  }

  await Message.updateMany(
    {
      _id: {
        $in: messages.map((message) => message._id),
      },
    },
    {
      $addToSet: {
        deliveredTo: userId,
        seenBy: userId,
      },
    },
  );

  return messages;
};