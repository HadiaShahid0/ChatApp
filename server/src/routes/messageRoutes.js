import express from "express";
import protect from "../middleware/authMiddleware/authMiddleware.js";
import {
  sendMessage,
  getMessages,
  markMessagesSeen
} from "../controllers/messageController/messageController.js";

const router = express.Router();

// Send Message
router.post("/", protect, sendMessage);

// Get Conversation Messages
router.get("/:conversationId", protect, getMessages);
router.put(
  "/seen/:conversationId",
  protect,
  markMessagesSeen
);
export default router;