import { Server } from "socket.io";
import User from "../models/userModel.js";

const onlineUsers = new Map();

const socketHelper = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket Connected: ${socket.id}`);

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
  });

  return io;
};

export default socketHelper;
export { onlineUsers };