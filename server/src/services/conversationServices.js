import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModal.js";
export const createOrGetConversationService = async (senderId, receiverId) => {
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
    "-password",
  );
};

export const getMyConversationsService = async (userId) => {
  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate("participants", "-password")
    .populate("admin", "-password")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name profileImage",
      },
    })
    .sort({
      updatedAt: -1,
    });

  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await Message.countDocuments({
        conversation: conversation._id,
        sender: {
          $ne: userId,
        },
        seenBy: {
          $ne: userId,
        },
      });

      return {
        ...conversation.toObject(),
        unreadCount,
      };
    }),
  );

  return conversationsWithUnread;
};
