import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModal.js";
export const createGroupService = async (
  groupName,
  adminId,
  participants = [],
  groupImage = "",
) => {
  if (!groupName?.trim()) {
    throw new Error("Group name is required.");
  }

  const uniqueMembers = [...new Set([...participants, adminId.toString()])];

  if (uniqueMembers.length < 2) {
    throw new Error("A group must contain at least 2 members.");
  }

  const group = await Conversation.create({
    participants: uniqueMembers,

    isGroup: true,

    groupName,

    groupImage,

    admin: adminId,
  });

  return await Conversation.findById(group._id)
    .populate("participants", "name email profileImage status")
    .populate("admin", "name email profileImage")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name profileImage",
      },
    });
};

export const getGroupsService = async (userId) => {
  return await Conversation.find({
    isGroup: true,
    participants: userId,
  })
    .populate("participants", "name profileImage status")
    .populate("admin", "name profileImage")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name profileImage",
      },
    })
    .sort({ updatedAt: -1 });
};

export const addMemberService = async (groupId, memberId) => {
  return await Conversation.findByIdAndUpdate(
    groupId,
    {
      $addToSet: {
        participants: memberId,
      },
    },
    {
      new: true,
    },
  )
    .populate("participants", "name profileImage status")
    .populate("admin", "name");
};
export const removeMemberService = async (groupId, memberId) => {
  return await Conversation.findByIdAndUpdate(
    groupId,
    {
      $pull: {
        participants: memberId,
      },
    },
    {
      new: true,
    },
  )
    .populate("participants", "name profileImage status")
    .populate("admin", "name");
};

export const sendGroupMessageService = async (
  senderId,
  groupId,
  text,
  image,
) => {
  const conversation = await Conversation.findById(groupId);

  if (!conversation || !conversation.isGroup) {
    throw new Error("Group not found");
  }

  const message = await Message.create({
    conversation: groupId,
    sender: senderId,
    text,
    image,

    // Sender has already delivered and seen their own message
    deliveredTo: [senderId],
    seenBy: [senderId],
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  return await Message.findById(message._id)
    .populate("sender", "-password")
    .populate({
      path: "conversation",
      populate: {
        path: "participants",
        select: "name profileImage status",
      },
    });
};

export const leaveGroupService = async (groupId, userId) => {
  const group = await Conversation.findById(groupId);

  if (!group) {
    throw new Error("Group not found.");
  }

  if (!group.isGroup) {
    throw new Error("This is not a group.");
  }

  const isMember = group.participants.some(
    (id) => id.toString() === userId.toString()
  );

  if (!isMember) {
    throw new Error("You are not a member of this group.");
  }

  // Remove user
  group.participants = group.participants.filter(
    (id) => id.toString() !== userId.toString()
  );

  // If admin leaves, assign another member
  if (group.admin.toString() === userId.toString()) {
    if (group.participants.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * group.participants.length
      );

      group.admin = group.participants[randomIndex];
    }
  }

  await group.save();

  return await Conversation.findById(group._id)
    .populate("participants", "name email profileImage status")
    .populate("admin", "name email profileImage")
    .populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name profileImage",
      },
    });
};
export const deleteGroupService = async (groupId, userId) => {
  const group = await Conversation.findById(groupId);

  if (!group) {
    throw new Error("Group not found.");
  }

  if (!group.isGroup) {
    throw new Error("This is not a group.");
  }

  if (group.admin.toString() !== userId.toString()) {
    throw new Error("Only the group admin can delete the group.");
  }

  await Message.deleteMany({
    conversation: groupId,
  });

  await Conversation.findByIdAndDelete(groupId);

  return group;
};
