import {
  sendMessageService,
  getMessagesService,
  markMessagesSeenService,
} from "../../services/messageServices.js";
import { onlineUsers } from "../../utils/socketHelper.js";

export const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!receiverId || !text?.trim()) {
      throw new Error("Receiver and message are required.");
    }

    const message = await sendMessageService(
      req.user._id,
      receiverId,
      text.trim(),
    );

    // Get Socket.IO instance
    const io = req.app.get("io");

    // Find receiver's socket
    const receiverSocketId = onlineUsers.get(receiverId);

    // Send message instantly if receiver is online
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receiveMessage", message);
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully.",
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

    const messages = await getMessagesService(conversationId);

    res.status(200).json({
      success: true,
      messages,
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
    const messages = await markMessagesSeenService(
      req.params.conversationId,
      req.user._id
    );

    const senderMessage = messages.find(
      (message) =>
        message.sender.toString() !== req.user._id.toString()
    );

    if (senderMessage) {
      const io = req.app.get("io");

      const senderSocketId = onlineUsers.get(
        senderMessage.sender.toString()
      );

      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
          conversationId: req.params.conversationId,
        });
      }
    }

    res.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
