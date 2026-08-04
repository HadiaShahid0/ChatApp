import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
const routes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
};

export default routes;
