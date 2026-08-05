import Conversation from "../models/conversationModel.js";

export const createOrGetConversationService = async (
  senderId,
  receiverId
) => {
  let conversation = await Conversation.findOne({
    isGroup: false,
    participants: {
      $all: [senderId, receiverId],
      $size: 2,
    },
  }).populate("participants", "-password");

  if (conversation) {
    return conversation;
  }

  conversation = await Conversation.create({
    participants: [senderId, receiverId],
  });

  return await Conversation.findById(conversation._id).populate(
    "participants",
    "-password"
  );
};

export const getMyConversationsService = async (userId) => {
  return await Conversation.find({
    participants: userId,
  })
    .populate("participants", "-password")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });
};