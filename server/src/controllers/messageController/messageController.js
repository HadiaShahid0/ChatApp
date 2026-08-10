import {
  sendMessageService,
  getMessagesService,
  markMessagesSeenService,
} from "../../services/messageServices.js";
import Conversation from "../../models/conversationModel.js";
import { onlineUsers } from "../../utils/socketHelper.js";
import Message from "../../models/messageModal.js";
export const sendMessage = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    console.log("REQ USER:", req.user?._id);
    console.log("REQ FILE:", req.file);
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

      // Send message to all group members
      io.to(groupId).emit("receiveMessage", message);
    } else {
      // ONE-TO-ONE — DO NOT CHANGE
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
    console.log("SEND MESSAGE ERROR:", error.message);

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
