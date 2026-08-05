import express from "express";
import {
  createOrGetConversation,
  getMyConversations,
} from "../controllers/conversationController/conversationController.js";
import  protect from "../middleware/authMiddleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrGetConversation);

router.get("/", protect, getMyConversations);

export default router;