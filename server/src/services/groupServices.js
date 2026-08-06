import Conversation from "../models/conversationModel.js";

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
    .populate("admin", "name email profileImage");
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

