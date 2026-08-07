import express from "express";
import {
  createGroup,
  addMember,
  removeMember,
  getGroups,
} from "../controllers/groupController/groupController.js";
import protect from "../middleware/authMiddleware/authMiddleware.js";
import { createMulter } from "../middleware/uploadMiddleware/multer.js";

const router = express.Router();
const groupUpload = createMulter("groupAvatars");
router.post("/create", protect, groupUpload.single("groupImage"), createGroup);

router.get("/", protect, getGroups);

router.put("/:groupId/add-member", protect, addMember);

router.put("/:groupId/remove-member/:memberId", protect, removeMember);

export default router;
