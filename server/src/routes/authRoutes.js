import express from "express";

import {
  register,
  login,
  verify,
  logout,
} from "../controllers/authController/authController.js";

import protect from "../middleware/authMiddleware/authMiddleware.js";

const router = express.Router();

// Public Routes
router.post("/register", register);
router.post("/login", login);

// Protected Routes
router.get("/verify", protect, verify);
router.post("/logout", protect, logout);

export default router;