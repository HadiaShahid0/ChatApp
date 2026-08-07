import {
  createGroupService,
  getGroupsService,
  addMemberService,
  removeMemberService,
  sendGroupMessageService
} from "../../services/groupServices.js";

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

    group.participants.forEach((member) => {
      io.to(member._id.toString()).emit("newGroupCreated", group);
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

        const image = req.file
            ? `uploads/chat/${req.file.filename}`
            : "";

        const message = await sendGroupMessageService(
            req.user._id,
            groupId,
            text || "",
            image
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