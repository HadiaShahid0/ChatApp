import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import conversationRoutes from "./conversationRoutes.js";
import messageRoutes from "./messageRoutes.js";
import groupRoutes from "./groupRoutes.js";


const routes = (app) => {
  app.use("/api/auth", authRoutes);

  app.use("/api/users", userRoutes);

  app.use("/api/conversations", conversationRoutes);

  app.use("/api/messages", messageRoutes);

  app.use("/api/groups", groupRoutes);
};

export default routes;
