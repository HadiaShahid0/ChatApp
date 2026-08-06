import express from "express";
import protect from "../middleware/authMiddleware/authMiddleware.js";
import {
  sendMessage,
  getMessages,
  markMessagesSeen,
} from "../controllers/messageController/messageController.js";
import upload from "../middleware/uploadMiddleware/uploadChatImage.js";
const router = express.Router();

// Send Message
router.post("/", protect, upload.single("image"), sendMessage);

// Get Conversation Messages
router.get("/:conversationId", protect, getMessages);
router.put(
  "/seen/:conversationId",
  protect,
  markMessagesSeen
);
export default router;