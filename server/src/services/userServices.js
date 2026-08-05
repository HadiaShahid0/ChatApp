import User from "../models/userModel.js";

export const getCurrentUserService = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
};

export const updateProfileService = async (userId, name) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  user.name = name;

  await user.save();

  return user;
};

export const uploadProfileImageService = async (userId, imagePath) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  user.profileImage = imagePath;

  await user.save();

  return user;
};



export const getAllUsersService = async (userId, search = "") => {
  const query = {
    _id: { $ne: userId },
  };

  if (search) {
    query.name = {
      $regex: search,
      $options: "i",
    };
  }

  const users = await User.find(query)
    .select("-password")
    .sort({ name: 1 });

  return users;
};

