import express from "express";

import protect from "../middleware/authMiddleware/authMiddleware.js";

import { createMulter } from "../middleware/uploadMiddleware/multer.js";

import {
  getCurrentUser,
  updateProfile,
  uploadProfileImage,
  getAllUsers,
} from "../controllers/userController/userController.js";

const router = express.Router();
const upload = createMulter("profileAvatars");
router.get("/me", protect, getCurrentUser);

router.put("/profile", protect, updateProfile);

router.put(
  "/profile-image",
  protect,
  upload.single("profileImage"),
  uploadProfileImage
);
router.get("/", protect, getAllUsers);
export default router;