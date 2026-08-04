import authRoutes from "./authRoutes.js";

const routes = (app) => {
  app.use("/api/auth", authRoutes);
};

export default routes;
