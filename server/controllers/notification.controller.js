import { sendDiscordNotification, sendMattermostNotification } from '../services/notification.service.js';
import User from '../models/user.model.js';
import Project from '../models/project.model.js';

// Controller to save webhook URL for a user
export const saveUserWebhook = async (req, res) => {
  try {
    const { webhook, enabled, events } = req.body;
    const { userId } = req.user;
    
    // Find and update the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }
    
    // Initialize notifications if not exist
    if (!user.notifications) {
      user.notifications = {
        enabled: true,
        events: {
          taskAssigned: true,
          taskCompleted: true,
          mentionedInComment: true,
          deadlineApproaching: true
        }
      };
    }
    
    // Update notifications
    if (webhook !== undefined) user.notifications.webhook = webhook;
    if (enabled !== undefined) user.notifications.enabled = enabled;
    
    // Update event settings if provided
    if (events) {
      Object.keys(events).forEach(key => {
        if (user.notifications.events[key] !== undefined) {
          user.notifications.events[key] = events[key];
        }
      });
    }
    
    await user.save();
    
    // Test the webhook if provided
    let testResult = null;
    if (webhook) {
      const message = 'This is a test notification from TaskFlow';
      if (webhook.startsWith('https://discord.com/api/webhooks/')) {
        testResult = await sendDiscordNotification(webhook, message);
      } else if (webhook.includes('hooks.mattermost.com') || webhook.includes('/hooks/')) {
        testResult = await sendMattermostNotification(webhook, message);
      }
    }
    
    res.status(200).json({
      status: true,
      message: 'Notification settings saved successfully',
      testResult,
      notifications: user.notifications
    });
  } catch (error) {
    console.error('Error in saveUserWebhook controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while saving webhook'
    });
  }
};

// Controller to save webhook URL for a project
export const saveProjectWebhook = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { webhook, enabled, events } = req.body;
    const { userId } = req.user;
    
    // Find the project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        status: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is an admin of the project
    const isMember = project.members.includes(userId);
    if (!isMember) {
      return res.status(403).json({
        status: false,
        message: 'Not authorized to modify project notifications'
      });
    }
    
    // Initialize notifications if not exist
    if (!project.notifications) {
      project.notifications = {
        enabled: true,
        events: {
          taskCreated: true,
          taskUpdated: true,
          taskCompleted: true,
          commentAdded: true
        }
      };
    }
    
    // Update notifications
    if (webhook !== undefined) project.notifications.webhook = webhook;
    if (enabled !== undefined) project.notifications.enabled = enabled;
    
    // Update event settings if provided
    if (events) {
      Object.keys(events).forEach(key => {
        if (project.notifications.events[key] !== undefined) {
          project.notifications.events[key] = events[key];
        }
      });
    }
    
    await project.save();
    
    // Test the webhook if provided
    let testResult = null;
    if (webhook) {
      const message = `This is a test notification for project: ${project.name}`;
      if (webhook.startsWith('https://discord.com/api/webhooks/')) {
        testResult = await sendDiscordNotification(webhook, message);
      } else if (webhook.includes('hooks.mattermost.com') || webhook.includes('/hooks/')) {
        testResult = await sendMattermostNotification(webhook, message);
      }
    }
    
    res.status(200).json({
      status: true,
      message: 'Project notification settings saved successfully',
      testResult,
      notifications: project.notifications
    });
  } catch (error) {
    console.error('Error in saveProjectWebhook controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while saving project webhook'
    });
  }
};

// Controller to get user's notification settings
export const getUserNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const user = await User.findById(userId).select('notifications');
    
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: true,
      notifications: user.notifications || {
        enabled: true,
        events: {
          taskAssigned: true,
          taskCompleted: true,
          mentionedInComment: true,
          deadlineApproaching: true
        }
      }
    });
  } catch (error) {
    console.error('Error in getUserNotificationSettings controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while getting notification settings'
    });
  }
};

// Controller to get project's notification settings
export const getProjectNotificationSettings = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId).select('notifications');
    
    if (!project) {
      return res.status(404).json({
        status: false,
        message: 'Project not found'
      });
    }
    
    res.status(200).json({
      status: true,
      notifications: project.notifications || {
        enabled: true,
        events: {
          taskCreated: true,
          taskUpdated: true,
          taskCompleted: true,
          commentAdded: true
        }
      }
    });
  } catch (error) {
    console.error('Error in getProjectNotificationSettings controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while getting project notification settings'
    });
  }
};