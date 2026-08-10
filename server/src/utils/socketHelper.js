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
    // USER JOIN
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

    // DISCONNECT
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

    // GROUP EVENTS
    socket.on("joinGroup", ({ groupId }) => {
      socket.join(groupId);
    });

    socket.on("leaveGroup", ({ groupId }) => {
      socket.leave(groupId);
    });

    // Add member to group room
    socket.on("addMember", async ({ groupId, memberId }) => {
      try {
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

        if (!group) return;

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

        // Notify existing members
        io.to(groupId).emit("groupUpdated", {
          group,
        });
      } catch (error) {
        console.log(error);
      }
    });

    socket.on("removeMember", async ({ groupId, memberId }) => {
      try {
        // Get the UPDATED group after the member was removed
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

        if (!group) return;

        // Find removed user's socket
        const memberSocketId = onlineUsers.get(memberId);

        if (memberSocketId) {
          const memberSocket = io.sockets.sockets.get(memberSocketId);

          if (memberSocket) {
            // Remove them from Socket.IO group room
            memberSocket.leave(groupId);

            // Tell ONLY the removed user to remove this group
            memberSocket.emit("removedFromGroup", {
              groupId: groupId.toString(),
            });
          }
        }

        // Notify remaining members with updated group
        io.to(groupId).emit("groupUpdated", {
          group,
        });
      } catch (error) {
        console.log("Remove member socket error:", error);
      }
    });

    // New group message
    // socket.on("newGroupMessage", ({ groupId, message }) => {
    //   // Send message to all group members except sender
    //   socket.to(groupId).emit("newGroupMessage", message);

    //   console.log(`New message sent in group ${groupId}`);
    // });

    // TYPING
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

    socket.on("stopTyping", ({ receiverId, senderId, groupId }) => {
      // If groupId is provided, emit typing to the group room
      if (groupId) {
        io.to(groupId).emit("stopTyping", {
          groupId,
          senderId,
        });
        return;
      }

      const receiverSocket = onlineUsers.get(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("stopTyping", {
          senderId,
        });
      }
    });

    // MESSAGE SEEN
    // socket.on("messagesSeen", async ({ conversationId, userId }) => {
    //   try {
    //     if (!conversationId || !userId) return;

    //     const messages = await Message.find({
    //       conversation: conversationId,
    //       sender: { $ne: userId },
    //       seenBy: { $ne: userId },
    //     }).select("_id sender");

    //     if (!messages.length) return;

    //     await Message.updateMany(
    //       {
    //         _id: { $in: messages.map((msg) => msg._id) },
    //       },
    //       {
    //         $addToSet: {
    //           seenBy: userId,
    //         },
    //       },
    //     );

    //     const messageIds = messages.map((msg) => msg._id.toString());

    //     // Notify every sender whose message was seen
    //     const senderIds = [
    //       ...new Set(messages.map((msg) => msg.sender.toString())),
    //     ];

    //     senderIds.forEach((senderId) => {
    //       const senderSocket = onlineUsers.get(senderId);

    //       if (senderSocket) {
    //         io.to(senderSocket).emit("messagesSeen", {
    //           conversationId: conversationId.toString(),
    //           userId: userId.toString(),
    //           messageIds,
    //         });
    //       }
    //     });
    //   } catch (error) {
    //     console.error("Seen error:", error);
    //   }
    // });

    // MESSAGE DELIVERED
    socket.on("messageDelivered", async ({ messageId, userId }) => {
      try {
        console.log("DELIVERY RECEIVED:", messageId, userId);

        const message = await Message.findById(messageId);

        if (!message) {
          console.log("MESSAGE NOT FOUND");
          return;
        }

        const alreadyDelivered = message.deliveredTo.some(
          (id) => String(id) === String(userId),
        );

        if (!alreadyDelivered) {
          message.deliveredTo.push(userId);

          await message.save();
        }

        console.log("DELIVERED TO:", message.deliveredTo);

        // Send delivery update ONLY to sender
        const senderSocketId = onlineUsers.get(String(message.sender));

        console.log("SENDER SOCKET:", senderSocketId);

        if (senderSocketId) {
          io.to(senderSocketId).emit("messageDelivered", {
            messageId: String(message._id),
            userId: String(userId),
          });

          console.log("DELIVERY SENT TO SENDER");
        }
      } catch (error) {
        console.error("Delivery error:", error);
      }
    });
  });

  return io;
};

export default socketHelper;
export { onlineUsers };
