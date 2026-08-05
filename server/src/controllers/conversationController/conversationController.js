import {
  createOrGetConversationService,
  getMyConversationsService,
} from "../../services/conversationServices.js";

export const createOrGetConversation = async (req, res) => {
  try {
    const conversation =
      await createOrGetConversationService(
        req.user._id,
        req.body.receiverId
      );

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyConversations = async (req, res) => {
  try {
    const conversations =
      await getMyConversationsService(req.user._id);

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};