import { Server } from "socket.io";
import User from "../models/userModel.js";
import Message from "../models/messageModal.js";
const onlineUsers = new Map();

const socketHelper = (server) => {
  // Initialize Socket.IO server
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  // Handle Socket.IO connections
  io.on("connection", (socket) => {
    // Handle user joining the chat
    socket.on("join", async (userId) => {
      try {
        socket.join(userId);

        onlineUsers.set(userId, socket.id);

        await User.findByIdAndUpdate(userId, {
          status: "online",
          socketId: socket.id,
        });

        io.emit("userOnline", userId);

        console.log(`${userId} joined`);
      } catch (error) {
        console.log(error.message);
      }
    });

    // Handle user disconnecting from the chat
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
      } catch (error) {
        console.log(error.message);
      }
    });

    //Handle typing events
    socket.on("typing", ({ receiverId, sender }) => {
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", sender);
      }
    });

    //Handle stop typing events
    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stopTyping");
      }
    });

    //Handle messages seen events
    socket.on("messagesSeen", ({ senderId, conversationId }) => {
      const senderSocketId = onlineUsers.get(senderId);

      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
          conversationId,
        });
      }
    });
    socket.on("messageDelivered", async ({ messageId, senderId }) => {
      await Message.findByIdAndUpdate(messageId, {
        delivered: true,
      });

      const senderSocketId = onlineUsers.get(senderId);

      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDelivered", {
          messageId,
        });
      }
    });
  });

  return io;
};

export default socketHelper;
export { onlineUsers };
