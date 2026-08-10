import {
  sendMessageService,
  getMessagesService,
  markMessagesSeenService,
} from "../../services/messageServices.js";
import Conversation from "../../models/conversationModel.js";
import { onlineUsers } from "../../utils/socketHelper.js";

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, groupId, text } = req.body;

    if (!receiverId && !groupId) {
      throw new Error("Receiver or Group is required.");
    }

    const image = req.file ? `uploads/chat/${req.file.filename}` : "";

    if (!text?.trim() && !image) {
      throw new Error("Message or image is required.");
    }

    const message = await sendMessageService(
      req.user._id,
      receiverId,
      text || "",
      image,
      groupId,
    );

    const io = req.app.get("io");

    if (message.conversation.isGroup) {
      const groupId = String(message.conversation._id);

      // Send message to everyone in the group
      io.to(groupId).emit("receiveMessage", message);

      const participants = message.conversation.participants || [];

      const onlineMemberIds = participants
        .map((member) => String(member._id || member))
        .filter(
          (memberId) =>
            memberId !== String(req.user._id) && onlineUsers.has(memberId),
        );

      // Mark only ONLINE members as delivered
      if (onlineMemberIds.length > 0) {
        await Message.findByIdAndUpdate(message._id, {
          $addToSet: {
            deliveredTo: {
              $each: onlineMemberIds,
            },
          },
        });

        // Notify sender about each delivered member
        const senderSocketId = onlineUsers.get(String(req.user._id));

        if (senderSocketId) {
          onlineMemberIds.forEach((userId) => {
            io.to(senderSocketId).emit("messageDelivered", {
              messageId: String(message._id),
              userId: String(userId),
            });
          });
        }
      }
    } else {
      // ONE-TO-ONE

      const receiverSocketId = onlineUsers.get(receiverId.toString());

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", message);
      }
    }

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { limit = 20, before = null } = req.query;

    const result = await getMessagesService(
      conversationId,
      Number(limit),
      before,
    );

    res.status(200).json({
      success: true,
      messages: result.messages,
      hasMore: result.hasMore,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const markMessagesSeen = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user._id;

    const messages = await markMessagesSeenService(conversationId, userId);

    const io = req.app.get("io");

    if (messages.length > 0) {
      const messageIds = messages.map((message) => String(message._id));

      const senderIds = [
        ...new Set(messages.map((message) => String(message.sender))),
      ];

      senderIds.forEach((senderId) => {
        const senderSocketId = onlineUsers.get(senderId);

        if (senderSocketId) {
          io.to(senderSocketId).emit("messagesSeen", {
            conversationId: String(conversationId),
            userId: String(userId),
            messageIds,
          });
        }
      });
    }

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Mark seen error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
