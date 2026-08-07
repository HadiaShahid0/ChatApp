import { Server } from "socket.io";
import User from "../models/userModel.js";
import Message from "../models/messageModal.js";
import Conversation from "../models/conversationModel.js";

const onlineUsers = new Map();

const socketHelper = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // =========================
    // USER JOIN
    // =========================
    socket.on("join", async (userId) => {
      try {
        // Personal room
        socket.join(userId);

        onlineUsers.set(userId, socket.id);

        await User.findByIdAndUpdate(userId, {
          status: "online",
          socketId: socket.id,
        });

        // Join all group rooms
        const groups = await Conversation.find({
          participants: userId,
          isGroup: true,
        }).select("_id");

        groups.forEach((group) => {
          socket.join(group._id.toString());
        });

        io.emit("userOnline", userId);

        console.log(`${userId} joined`);
      } catch (err) {
        console.log(err.message);
      }
    });

    // =========================
    // DISCONNECT
    // =========================
    socket.on("disconnect", async () => {
      try {
        let disconnectedUser = null;

        for (const [userId, socketId] of onlineUsers.entries()) {
          if (socketId === socket.id) {
            disconnectedUser = userId;
            onlineUsers.delete(userId);
            break;
          }
        }

        if (disconnectedUser) {
          await User.findByIdAndUpdate(disconnectedUser, {
            status: "offline",
            socketId: null,
            lastSeen: new Date(),
          });

          io.emit("userOffline", disconnectedUser);

          console.log(`${disconnectedUser} disconnected`);
        }
      } catch (err) {
        console.log(err.message);
      }
    });

    // =========================
    // GROUP EVENTS
    // =========================

    socket.on("joinGroup", ({ groupId }) => {
      socket.join(groupId);

      console.log(`Socket ${socket.id} joined group ${groupId}`);
    });

    socket.on("leaveGroup", ({ groupId }) => {
      socket.leave(groupId);

      console.log(`Socket ${socket.id} left group ${groupId}`);
    });

    // Add member to group room
    socket.on("addMember", async ({ groupId, memberId }) => {
      const group = await Conversation.findById(groupId)
        .populate("participants", "name profileImage status")
        .populate("admin", "name profileImage")
        .populate({
          path: "lastMessage",
          populate: {
            path: "sender",
            select: "name profileImage",
          },
        });

      const memberSocketId = onlineUsers.get(memberId);

      if (memberSocketId) {
        const memberSocket = io.sockets.sockets.get(memberSocketId);

        if (memberSocket) {
          memberSocket.join(groupId);

          memberSocket.emit("addedToGroup", {
            group,
          });
        }
      }

      io.to(groupId).emit("addMember", {
        group,
      });
    });

    socket.on("removeMember", async ({ groupId, memberId }) => {
      const group = await Conversation.findById(groupId)
        .populate("participants", "name profileImage status")
        .populate("admin", "name profileImage");

      const memberSocketId = onlineUsers.get(memberId);

      if (memberSocketId) {
        const memberSocket = io.sockets.sockets.get(memberSocketId);

        if (memberSocket) {
          memberSocket.leave(groupId);

          // Tell removed user
          memberSocket.emit("removedFromGroup", {
            groupId,
          });
        }
      }

      // Tell everyone still in the group
      io.to(groupId).emit("removeMember", {
        group,
      });
    });

    // New group message
    socket.on("newGroupMessage", ({ groupId, message }) => {
      // Send message to all group members except sender
      socket.to(groupId).emit("newGroupMessage", message);

      console.log(`New message sent in group ${groupId}`);
    });

    // =========================
    // TYPING
    // =========================
    socket.on("typing", ({ receiverId, senderId, sender, groupId }) => {
      // If groupId is provided, emit typing to the group room
      if (groupId) {
        io.to(groupId).emit("typing", {
          groupId,
          senderId,
          sender,
        });
        return;
      }

      // Otherwise emit to the receiver's personal socket
      const receiverSocket = onlineUsers.get(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("typing", {
          senderId,
          sender,
        });
      }
    });

    socket.on("stopTyping", ({ receiverId, senderId }) => {
      const receiverSocket = onlineUsers.get(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("stopTyping", {
          senderId,
        });
      }
    });

    // =========================
    // MESSAGE SEEN
    // =========================
    socket.on("messagesSeen", ({ senderId, conversationId }) => {
      const senderSocket = onlineUsers.get(senderId);

      if (senderSocket) {
        io.to(senderSocket).emit("messagesSeen", {
          conversationId,
        });
      }
    });

    // =========================
    // MESSAGE DELIVERED
    // =========================
    socket.on("messageDelivered", async ({ messageId, userId }) => {
      try {
        const message =
          await Message.findById(messageId).populate("conversation");

        if (!message) return;

        // Don't add duplicate ids
        if (
  !message.deliveredTo.some(
    (id) => id.toString() === userId.toString()
  )
) {
  message.deliveredTo.push(userId);
  await message.save();
}

        const senderSocket = onlineUsers.get(message.sender.toString());

        if (senderSocket) {
          io.to(senderSocket).emit("messageDelivered", {
            messageId,
            deliveredTo: message.deliveredTo,
          });
        }
      } catch (err) {
        console.log(err);
      }
    });
  });

  return io;
};

export default socketHelper;
export { onlineUsers };
