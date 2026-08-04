import {
  registerService,
  loginService,
  verifyService,
  logoutService,
} from "../../services/authServices.js";

// Register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const { user, token } = await registerService(
      name,
      email,
      password
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await loginService(
      email,
      password
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify User
export const verify = async (req, res) => {
  try {
    const user = await verifyService(req.user._id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    await logoutService();

    res.clearCookie("token");

    res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};