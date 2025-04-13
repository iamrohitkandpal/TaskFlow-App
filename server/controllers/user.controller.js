import User from "../models/user.model.js";
import Notice from "../models/notification.model.js";
import { createJWT } from "../utils/connectDB.utils.js";
import { asyncHandler, ensureUserId, safeQuery, validateId } from '../utils/controllerUtils.js';

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, isAdmin, role, title } = req.body;

  if (!name || !email || !password) {
    const error = new Error('Name, email, and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const userExists = await safeQuery(
    () => User.findOne({ email }),
    'Failed to check if user exists'
  );
  
  if (userExists) {
    const error = new Error('User already exists.');
    error.statusCode = 400;
    throw error;
  }

  const user = await safeQuery(
    () => User.create({
      name,
      email,
      password,
      isAdmin,
      role,
      title,
    }),
    'Failed to create user'
  );

  if (user) {
    if (isAdmin) createJWT(res, user._id);
    user.password = undefined;

    return res.status(201).json({
      status: true,
      message: "User registered successfully.",
      user,
    });
  }

  const error = new Error('Invalid user data.');
  error.statusCode = 400;
  throw error;
});

export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: 'Email and password are required.'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: false,
        message: 'User is deactivated. Contact admin.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: 'Invalid email or password.'
      });
    }

    createJWT(res, user._id);
    user.password = undefined;

    res.status(200).json({
      status: true,
      message: "Login successful.",
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: false,
      message: error.message || "An error occurred during login"
    });
  }
});

export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({ status: true, message: "Logged out successfully." });
});

export const getTeamList = asyncHandler(async (req, res) => {
  const users = await safeQuery(
    () => User.find({ isActive: true }).select("name email role title isActive"),
    'Failed to fetch team list'
  );

  res.status(200).json({
    status: true,
    message: "Team list fetched successfully.",
    users,
  });
});

export const getNotificationsList = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  
  // Add additional logging
  console.log(`Fetching notifications for user: ${userId}`);
  
  try {
    // First check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    
    // Then query notifications with more fault-tolerance
    const notices = await Notice.find({
      team: userId,
      isRead: { $nin: [userId] },
    }).populate("task", "title").lean();
    
    res.status(200).json({
      status: true,
      message: "Notifications fetched successfully.",
      notices: notices || []
    });
  } catch (error) {
    console.error(`Notification fetch error: ${error.message}`, error);
    if (error.name === 'CastError') {
      // Handle invalid MongoDB ID
      res.status(400).json({
        status: false,
        message: "Invalid user ID format"
      });
    } else {
      res.status(500).json({
        status: false,
        message: "Server error while fetching notifications",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { _id } = req.body;

  const id = isAdmin && userId === _id ? userId : isAdmin ? _id : userId;

  const user = await safeQuery(
    () => User.findById(id),
    'Failed to find user'
  );
  
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  user.name = req.body.name || user.name;
  user.role = req.body.role || user.role;
  user.title = req.body.title || user.title;

  const updatedUser = await safeQuery(
    () => user.save(),
    'Failed to update user profile'
  );
  
  user.password = undefined;

  res.status(200).json({
    status: true,
    message: "User profile updated successfully.",
    user: updatedUser,
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { isReadType, id } = req.query;

  if (isReadType === "all") {
    await safeQuery(
      () => Notice.updateMany(
        { team: userId, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } }
      ),
      'Failed to mark all notifications as read'
    );
  } else {
    await safeQuery(
      () => Notice.findOneAndUpdate(
        { _id: id, isRead: { $nin: [userId] } },
        { $push: { isRead: userId } },
        { new: true }
      ),
      'Failed to mark notification as read'
    );
  }

  res.status(201).json({ status: true, message: "Done Read Notification" });
});

export const changeUserPassword = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const user = await safeQuery(
    () => User.findById(userId),
    'Failed to find user'
  );
  
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  user.password = req.body.password;
  await safeQuery(
    () => user.save(),
    'Failed to change user password'
  );

  user.password = undefined;
  res.status(200).json({ status: true, message: "Password changed successfully." });
});

export const activateUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await safeQuery(
    () => User.findById(id),
    'Failed to find user'
  );
  
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  user.isActive = req.body.isActive;
  await safeQuery(
    () => user.save(),
    'Failed to activate/deactivate user profile'
  );

  res.status(200).json({
    status: true,
    message: `User account has been ${user.isActive ? "activated" : "disabled"}.`,
  });
});

export const deleteUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await safeQuery(
    () => User.findByIdAndDelete(id),
    'Failed to delete user profile'
  );
  
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  res.status(200).json({
    status: true,
    message: "User deleted successfully.",
  });
});

export const updateUserSkills = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { skills } = req.body;
  
  const userIdToUpdate = userId === 'profile' ? req.user.userId : userId;
  
  if (userIdToUpdate !== req.user.userId && !req.user.isAdmin) {
    const error = new Error('You do not have permission to update this user\'s skills');
    error.statusCode = 403;
    throw error;
  }
  
  const user = await safeQuery(
    () => User.findById(userIdToUpdate),
    'Failed to find user'
  );
  
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  
  user.skills = Array.isArray(skills) ? skills : [];
  await safeQuery(
    () => user.save(),
    'Failed to update user skills'
  );
  
  res.status(200).json({
    status: true,
    message: 'Skills updated successfully',
    skills: user.skills
  });
});
