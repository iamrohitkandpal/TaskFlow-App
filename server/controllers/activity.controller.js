import { getTaskActivities } from "../services/activity.service.js";
import Activity from "../models/activity.model.js";

// Get recent activities
export const getRecentActivities = async (req, res) => {
  try {
    const { limit = 10, projectId } = req.query;
    
    const query = {};
    if (projectId) {
      // If project ID is specified, filter activities by project
      // This assumes tasks have a projectId field
      const projectTasks = await Task.find({ projectId }).select('_id');
      const taskIds = projectTasks.map(task => task._id);
      query.taskId = { $in: taskIds };
    }
    
    const activities = await Activity.find(query)
      .populate("user", "name email avatar")
      .populate("taskId", "title")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      status: true,
      activities
    });
  } catch (error) {
    console.error("Error in getRecentActivities controller:", error.stack);
    res.status(500).json({
      status: false,
      message: "Server error. Please try again later."
    });
  }
};

// Controller: Get Task Activities
export const getTaskActivities = async (req, res) => {
  try {
    const { taskId } = req.params;
    const activities = await getTaskActivities(taskId);

    res.status(200).json({
      status: true,
      activities,
    });
  } catch (error) {
    console.error("Error in getTaskActivities controller:", error.stack);
    res.status(500).json({
      status: false,
      message: "Server error. Please try again later.",
    });
  }
};

// Get user's own activities
export const getUserActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.userId;
    
    const activities = await Activity.find({ user: userId })
      .populate("taskId", "title")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      status: true,
      activities
    });
  } catch (error) {
    console.error("Error in getUserActivities controller:", error.stack);
    res.status(500).json({
      status: false,
      message: "Server error. Please try again later."
    });
  }
};