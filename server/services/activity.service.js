import Activity from "../models/activity.model.js";
import { io } from "../index.js";

export const logActivity = async (userId, taskId, type, description, details = {}) => {
  try {
    const activity = await Activity.create({
      user: userId,
      task: taskId,
      type,
      description,
      details,
    });

    // Populate user details for the activity feed
    const populatedActivity = await Activity.findById(activity._id)
      .populate("user", "name title")
      .populate("task", "title");

    // Emit the activity to connected clients
    io.emit("activity", populatedActivity);

    return populatedActivity;
  } catch (error) {
    console.error("Error logging activity:", error);
    throw error;
  }
};

export const getTaskActivities = async (taskId) => {
  try {
    const activities = await Activity.find({ task: taskId })
      .populate("user", "name title")
      .populate("task", "title")
      .sort({ createdAt: -1 });
    
    return activities;
  } catch (error) {
    console.error("Error fetching task activities:", error);
    throw error;
  }
};

export const getUserActivities = async (userId) => {
  try {
    const activities = await Activity.find({ user: userId })
      .populate("user", "name title")
      .populate("task", "title")
      .sort({ createdAt: -1 });
    
    return activities;
  } catch (error) {
    console.error("Error fetching user activities:", error);
    throw error;
  }
};

export const getRecentActivities = async (limit = 20) => {
  try {
    const activities = await Activity.find()
      .populate("user", "name title")
      .populate("task", "title")
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return activities;
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw error;
  }
};