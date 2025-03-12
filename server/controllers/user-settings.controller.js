import UserSettings from '../models/user-settings.model.js';
import User from '../models/user.model.js';
import Task from '../models/task.model.js';

export const getUserSettings = async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Find or create user settings
    let userSettings = await UserSettings.findOne({ userId });
    
    if (!userSettings) {
      userSettings = new UserSettings({ userId });
      await userSettings.save();
    }
    
    res.status(200).json({
      status: true,
      settings: userSettings
    });
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while fetching user settings'
    });
  }
};

export const updateUserSettings = async (req, res) => {
  try {
    const { userId } = req.user;
    const { wipLimit, theme, notificationPreferences } = req.body;
    
    // Find or create user settings
    let userSettings = await UserSettings.findOne({ userId });
    
    if (!userSettings) {
      userSettings = new UserSettings({ userId });
    }
    
    // Update fields if provided
    if (wipLimit !== undefined) userSettings.wipLimit = wipLimit;
    if (theme) userSettings.theme = theme;
    if (notificationPreferences) {
      userSettings.notificationPreferences = {
        ...userSettings.notificationPreferences,
        ...notificationPreferences
      };
    }
    
    await userSettings.save();
    
    res.status(200).json({
      status: true,
      message: 'Settings updated successfully',
      settings: userSettings
    });
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while updating user settings'
    });
  }
};

// Middleware to check WIP limits before assigning tasks
export const checkWipLimit = async (req, res, next) => {
  try {
    const taskData = req.body;
    
    // Skip check if no assignee or if it's a task update rather than creation
    if (!taskData.assignee || req.method === 'PUT') {
      return next();
    }
    
    const assigneeId = taskData.assignee;
    
    // Count active tasks (in progress) assigned to this user
    const activeTasks = await Task.countDocuments({
      assignee: assigneeId,
      stage: 'in-progress',
      isTrashed: false
    });
    
    // Get user's WIP limit
    const userSettings = await UserSettings.findOne({ userId: assigneeId });
    const wipLimit = userSettings?.wipLimit || 3; // Default to 3 if not set
    
    if (activeTasks >= wipLimit) {
      return res.status(400).json({
        status: false,
        message: `Cannot assign task. User has reached their WIP limit of ${wipLimit} tasks.`
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in checkWipLimit:', error);
    next(); // Continue if there's an error checking the limit
  }
};