import User from "../models/user.model.js";
import Notice from "../models/notification.model.js";
import { createJWT } from "../utils/connectDB.utils.js";

// Controller: Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin, role, title } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        status: false,
        message: "Name, email, and password are required.",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ status: false, message: "User already exists." });
    }

    const user = await User.create({
      name,
      email,
      password,
      isAdmin,
      role,
      title,
    });

    if (user) {
      if (isAdmin) createJWT(res, user._id);

      user.password = undefined;

      return res.status(201).json({
        status: true,
        message: "User registered successfully.",
        user,
      });
    }

    res.status(400).json({ status: false, message: "Invalid user data." });
  } catch (error) {
    console.error("Error in registerUser controller:", error.stack);
    res
      .status(500)
      .json({
        status: false,
        message: "Server error. Please try again later.",
      });
  }
};

// Controller: Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({
          status: false,
          message: "User is deactivated. Contact admin.",
        });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid email or password." });
    }

    createJWT(res, user._id);
    user.password = undefined;

    res.status(200).json({
      status: true,
      message: "Login successful.",
      user,
    });
  } catch (error) {
    console.error("Error in loginUser controller:", error.stack);
    res
      .status(500)
      .json({
        status: false,
        message: "Server error. Please try again later.",
      });
  }
};

// Controller: Logout User
export const logoutUser = (req, res) => {
  try {
    // Only clear the authentication token cookie
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      sameSite: "Strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ status: true, message: "Logged out successfully." });
  } catch (error) {
    console.error("Error in logoutUser controller:", error.stack);
    res
      .status(500)
      .json({
        status: false,
        message: "Server error. Please try again later.",
      });
  }
};

// Controller: Get Team List
export const getTeamList = async (req, res) => {
  try {
    // Only return active users for task assignment
    const users = await User.find({ isActive: true }).select("name email role title isActive");

    res.status(200).json({
      status: true,
      message: "Team list fetched successfully.",
      users,
    });
  } catch (error) {
    console.error("Error in getTeamList controller:", error.stack);
    res
      .status(500)
      .json({
        status: false,
        message: "Server error. Please try again later.",
      });
  }
};

// Controller: Get Notifications List
export const getNotificationsList = async (req, res) => {
  try {
    const { userId } = req.user;

    const notices = await Notice.find({
      team: userId,
      isRead: { $nin: [userId] },
    }).populate("task", "title");

    res.status(200).json({
      status: true,
      message: "Notifications fetched successfully.",
      notices,
    });
  } catch (error) {
    console.error("Error in getNotificationsList controller:", error.stack);
    res
      .status(500)
      .json({
        status: false,
        message: "Server error. Please try again later.",
      });
  }
};

// Controller: Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;
    const { _id } = req.body;

    const id = isAdmin && userId === _id ? userId : isAdmin ? _id : userId;

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found." });
    }

    user.name = req.body.name || user.name;
    user.role = req.body.role || user.role;
    user.title = req.body.title || user.title;

    const updatedUser = await user.save();
    user.password = undefined;

    res.status(200).json({
      status: true,
      message: "User profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateUserProfile controller:", error.stack);
    res
      .status(500)
      .json({
        status: false,
        message: "Server error. Please try again later.",
      });
  }
};

// Controller: Mark Notification as Read

export const markNotificationRead = async (req, res) => {
  try {
    const { userId } = req.user;
    const { isReadType, id } = req.query;

    if (isReadType === "all") {
      await Notice.updateMany(
        { team: userId, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } }
      );
    } else {
      await Notice.findOneAndUpdate(
        { _id: id, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } },
        { new: true }
      );
    }

    res
      .status(201)
      .json({ status: true, message: "Done Read Notification" });
  } catch (error) {
    console.error("Error in markNotificationRead controller:", error.stack);
    res
      .status(500)
      .json({
        status: false,
        message: "Server error. Please try again later.",
      });
  }
};

// Controller: Change User Password
export const changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found." });
    }

    user.password = req.body.password;
    await user.save();

    user.password = undefined;
    res
      .status(200)
      .json({ status: true, message: "Password changed successfully." });
  } catch (error) {
    console.error("Error in changeUserPassword controller:", error.stack);
    res
      .status(500)
      .json({
        status: false,
        message: "Server error. Please try again later.",
      });
  }
};

// Controller: Activate/Deactivate User Profile
export const activateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found." });
    }

    user.isActive = req.body.isActive;
    await user.save();

    res.status(200).json({
      status: true,
      message: `User account has been ${
        user.isActive ? "activated" : "disabled"
      }.`,
    });
  } catch (error) {
    console.error("Error in activateUserProfile controller:", error.stack);
    res
      .status(500)
      .json({
        status: false,
        message: "Server error. Please try again later.",
      });
  }
};

// Controller: Delete User Profile
export const deleteUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res
        .status(404)
        .json({ status: false, message: "User not found." });
    }

    res.status(200).json({
      status: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleteUserProfile controller:", error.stack);
    res
      .status(500)
      .json({
        status: false,
        message: "Server error. Please try again later.",
      });
  }
};
