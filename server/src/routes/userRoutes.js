import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

import {
  getCurrentUser,
  updateProfile,
  uploadProfileImage,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protect, getCurrentUser);

router.put("/profile", protect, updateProfile);

router.put(
  "/profile-image",
  protect,
  upload.single("profileImage"),
  uploadProfileImage
);

export default router;