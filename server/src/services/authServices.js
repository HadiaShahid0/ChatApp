import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import { generateToken } from "../utils/jwt.js";

// Register User
export const registerService = async (name, email, password) => {
  // Check if email already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email already exists.");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // Generate JWT
  const token = generateToken(user._id);

  return {
    user,
    token,
  };
};

// Login User
export const loginService = async (email, password) => {
  // Find user
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password.");
  }

  // Generate JWT
  const token = generateToken(user._id);

  return {
    user,
    token,
  };
};

// Verify User
export const verifyService = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
};

// Logout
export const logoutService = () => {
  return true;
};
