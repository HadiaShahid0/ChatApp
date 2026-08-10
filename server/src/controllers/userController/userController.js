import {
  getCurrentUserService,
  updateProfileService,
  uploadProfileImageService,
  getAllUsersService,
} from "../../services/userServices.js";
import { onlineUsers } from "../../utils/socketHelper.js";
export const getCurrentUser = async (req, res) => {
  try {
    const user = await getCurrentUserService(req.user._id);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await updateProfileService(req.user._id, name);

    const io = req.app.get("io");

    io.emit("profileUpdated", {
      user: {
        _id: user._id,
        name: user.name,
        profileImage: user.profileImage,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("Please select an image.");
    }

    const imagePath = `uploads/profileAvatars/${req.file.filename}`;

    const user = await uploadProfileImageService(
      req.user._id,
      imagePath
    );

    const io = req.app.get("io");

    // Notify all connected users
    io.emit("profileUpdated", {
      user: {
        _id: user._id,
        name: user.name,
        profileImage: user.profileImage,
      },
    });

    res.json({
      success: true,
      message: "Profile image uploaded successfully.",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const search = req.query.search || "";

    const users = await getAllUsersService(req.user._id, search);

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
