import { io } from "../index.js";
import Activity from "../models/activity.model.js";

// Record activity and broadcast updates
export const handleTaskUpdate = async (socket, data) => {
  try {
    const { action, task, userId, taskId } = data;
    
    // Log activity to database
    if (userId) {
      await Activity.create({
        user: userId,
        action,
        taskId: task?._id || taskId,
        details: task || { taskId },
      });
    }
    
    // Broadcast to specific rooms based on task's assignees or project members
    // This allows for targeted real-time updates
    if (task?.assignees) {
      task.assignees.forEach(assignee => {
        socket.to(assignee.toString()).emit("taskUpdated", data);
      });
    }
    
    // Also broadcast to general room for project members
    if (task?.projectId) {
      socket.to(`project-${task.projectId}`).emit("taskUpdated", data);
    }
    
    // Broadcast generally (could be optimized to remove once project-specific broadcasting works)
    socket.broadcast.emit("taskUpdated", data);
  } catch (error) {
    console.error("Error handling task update:", error);
  }
};

// Get recent activities
export const getActivities = async (limit = 10) => {
  try {
    const activities = await Activity.find()
      .populate("user", "name email avatar")
      .populate("taskId", "title")
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return activities;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};