import {
  getCurrentUserService,
  updateProfileService,
  uploadProfileImageService,
} from "../../services/userServices.js";

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
    const user = await updateProfileService(
      req.user._id,
      req.body.name
    );

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

    const user = await uploadProfileImageService(
      req.user._id,
      req.file.path
    );

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