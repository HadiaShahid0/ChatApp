import {
  createGroupService,
  getGroupsService,
  addMemberService,
  removeMemberService,
  sendGroupMessageService,
  leaveGroupService,
  deleteGroupService,
} from "../../services/groupServices.js";

import Conversation from "../../models/conversationModel.js";
import { onlineUsers } from "../../utils/socketHelper.js";

export const createGroup = async (req, res) => {
  try {
    const { groupName } = req.body;

    const participants = JSON.parse(req.body.participants || "[]");

    const image = req.file ? `uploads/groupAvatars/${req.file.filename}` : "";

    const group = await createGroupService(
      groupName,
      req.user._id,
      participants,
      image,
    );

    const io = req.app.get("io");

    // Send the group to creator + all selected members
    const memberIds = [
      req.user._id.toString(),
      ...participants.map((id) => id.toString()),
    ];

    memberIds.forEach((userId) => {
      io.to(userId).emit("newGroupCreated", {
        group,
      });
    });

    res.status(201).json({
      success: true,
      group,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await getGroupsService(req.user._id);

    res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;

    const group = await addMemberService(groupId, memberId);

    res.json({
      success: true,
      group,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;

    const group = await removeMemberService(groupId, memberId);

    res.json({
      success: true,
      group,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text } = req.body;

    const image = req.file ? `uploads/chat/${req.file.filename}` : "";

    const message = await sendGroupMessageService(
      req.user._id,
      groupId,
      text || "",
      image,
    );

    const io = req.app.get("io");

    io.to(groupId).emit("newGroupMessage", message);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const oldGroup = await Conversation.findById(groupId);

    if (!oldGroup) {
      throw new Error("Group not found.");
    }

    const wasAdmin =
      oldGroup.admin.toString() === userId.toString();

    const updatedGroup = await leaveGroupService(
      groupId,
      userId
    );

    const io = req.app.get("io");

    // =========================
    // GET LEAVING USER SOCKET
    // =========================

    const userSocketId = onlineUsers.get(
      userId.toString()
    );

    if (userSocketId) {
      const userSocket = io.sockets.sockets.get(
        userSocketId
      );

      if (userSocket) {
        userSocket.leave(groupId.toString());
      }
    }

    // =========================
    // TELL LEAVING USER
    // =========================

    io.to(userId.toString()).emit("groupLeft", {
      groupId: groupId.toString(),
    });

    // =========================
    // TELL REMAINING MEMBERS
    // =========================

    io.to(groupId.toString()).emit("groupUpdated", {
      group: updatedGroup,
      adminChanged: wasAdmin,
    });

    res.status(200).json({
      success: true,
      group: updatedGroup,
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Conversation.findById(groupId);

    if (!group) {
      throw new Error("Group not found.");
    }

    const memberIds = group.participants.map((id) => id.toString());

    const deletedGroup = await deleteGroupService(groupId, req.user._id);

    const io = req.app.get("io");

    // Tell all group members that the group was deleted
    memberIds.forEach((memberId) => {
      io.to(memberId).emit("groupDeleted", {
        groupId,
      });
    });

    // Remove everyone from the Socket.IO group room
    io.in(groupId).socketsLeave(groupId);

    res.json({
      success: true,
      group: deletedGroup,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
