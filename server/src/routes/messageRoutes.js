import express from "express";
import protect from "../middleware/authMiddleware/authMiddleware.js";
import {
  sendMessage,
  getMessages,
  markMessagesSeen,
} from "../controllers/messageController/messageController.js";
import { createMulter } from "../middleware/uploadMiddleware/multer.js";
const router = express.Router();
const chatUpload = createMulter("chat");
// Send Message
router.post("/", protect, chatUpload.single("image"), sendMessage);

// Get Conversation Messages
router.get("/:conversationId", protect, getMessages);
router.put("/seen/:conversationId", protect, markMessagesSeen);
export default router;
