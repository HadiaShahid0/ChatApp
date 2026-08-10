import {
  sendMessageService,
  getMessagesService,
  markMessagesSeenService,
} from "../../services/messageServices.js";
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
      // Send to everyone in the group room
      io.to(message.conversation._id.toString()).emit(
        "receiveMessage",
        message,
      );
    } else {
      // Send only to receiver
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

    const seenMessageIds = messages
      .filter((msg) => String(msg.sender) !== String(userId))
      .map((msg) => msg._id.toString());

    const senderIds = [
      ...new Set(
        messages
          .filter((msg) => String(msg.sender) !== String(userId))
          .map((msg) => String(msg.sender)),
      ),
    ];

    senderIds.forEach((senderId) => {
      const senderSocketId = onlineUsers.get(senderId);

      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
          conversationId: String(conversationId),
          userId: String(userId),
          messageIds: seenMessageIds,
        });
      }
    });

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
