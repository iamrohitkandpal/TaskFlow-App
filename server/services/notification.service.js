import axios from 'axios';
import { WebhookClient } from 'webhook-discord';
import User from '../models/user.model.js';
import Project from '../models/project.model.js';

// Send notification to Discord webhook
export const sendDiscordNotification = async (webhookUrl, message, embeds = []) => {
  try {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }
    
    const webhook = new WebhookClient(webhookUrl);
    await webhook.send(message);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    return { success: false, error };
  }
};

// Send notification to Mattermost webhook
export const sendMattermostNotification = async (webhookUrl, message, props = {}) => {
  try {
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }
    
    await axios.post(webhookUrl, {
      text: message,
      username: 'TaskFlow',
      icon_url: 'https://your-taskflow-icon-url.com',
      props
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending Mattermost notification:', error);
    return { success: false, error };
  }
};

// Notify project members about a task
export const notifyTaskUpdate = async (taskId, message, action) => {
  try {
    // Find project for this task
    const project = await Project.findOne({ tasks: taskId })
      .populate({
        path: 'members',
        select: 'notifications'
      });
    
    if (!project) return;
    
    // Get webhook URLs from project and members
    const projectWebhook = project.notifications?.webhook;
    const memberWebhooks = project.members
      .filter(member => member.notifications?.enabled)
      .map(member => member.notifications?.webhook)
      .filter(Boolean);
    
    const webhooks = [projectWebhook, ...memberWebhooks].filter(Boolean);
    
    // Send notifications to all webhooks
    const promises = webhooks.map(webhook => {
      if (webhook.startsWith('https://discord.com/api/webhooks/')) {
        return sendDiscordNotification(webhook, message);
      } else if (webhook.includes('hooks.mattermost.com') || webhook.includes('/hooks/')) {
        return sendMattermostNotification(webhook, message);
      }
      return Promise.resolve();
    });
    
    await Promise.all(promises);
    
    return { success: true };
  } catch (error) {
    console.error('Error in notifyTaskUpdate:', error);
    return { success: false, error };
  }
};