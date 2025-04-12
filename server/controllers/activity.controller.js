import { getTaskActivities as fetchTaskActivities, getUserActivities as fetchUserActivities, getRecentActivities as fetchRecentActivities } from "../services/activity.service.js";

/**
 * Get recent activities across the system
 */
export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const activities = await fetchRecentActivities(parseInt(limit));
    
    res.status(200).json({
      status: true,
      activities
    });
  } catch (error) {
    console.error("Error in getRecentActivities controller:", error.message, error.stack);
    res.status(500).json({
      status: false,
      message: "Server error. Please try again later."
    });
  }
};

/**
 * Get activities for a specific task
 */
export const getTaskActivities = async (req, res) => {
  try {
    const { taskId } = req.params;
    const activities = await fetchTaskActivities(taskId);

    res.status(200).json({
      status: true,
      activities,
    });
  } catch (error) {
    console.error("Error in getTaskActivities controller:", error.message, error.stack);
    res.status(500).json({
      status: false,
      message: "Server error. Please try again later.",
    });
  }
};

/**
 * Get activities for the current authenticated user
 */
export const getUserActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.userId;
    
    const activities = await fetchUserActivities(userId, parseInt(limit));
    
    res.status(200).json({
      status: true,
      activities
    });
  } catch (error) {
    console.error("Error in getUserActivities controller:", error.message, error.stack);
    res.status(500).json({
      status: false,
      message: "Server error. Please try again later."
    });
  }
};