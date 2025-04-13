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

// Export the middleware properly
export const checkWipLimit = async (req, res, next) => {
  try {
    const { userId } = req.user;
    
    // Get user's WIP limit setting
    const userSettings = await UserSettings.findOne({ userId });
    const wipLimit = userSettings?.wipLimit || 3; // Default to 3 if not set
    
    // Count tasks currently in progress for the user
    const tasksInProgressCount = await Task.countDocuments({
      assignee: userId,
      stage: 'in-progress',
      isTrashed: false
    });
    
    // Check if limit would be exceeded
    if (tasksInProgressCount >= wipLimit) {
      return res.status(409).json({
        status: false,
        message: `Cannot assign task. User has reached their work-in-progress limit of ${wipLimit} tasks.`
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in checkWipLimit middleware:', error);
    next(error);
  }
};