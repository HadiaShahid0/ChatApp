import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import conversationRoutes from "./conversationRoutes.js";

const routes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/conversations", conversationRoutes);
};

export default routes;
