import axios from 'axios';
import pkg from 'webhook-discord';
const { WebhookClient } = pkg;
import User from '../models/user.model.js';
import Project from '../models/project.model.js';

/**
 * Sends a notification to a Discord webhook
 * @param {string} webhookUrl - Discord webhook URL
 * @param {string} message - Message to send
 * @param {Array} embeds - Optional Discord embeds for rich messages
 * @returns {Object} Result with success status
 */
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

/**
 * Sends a notification to a Mattermost webhook
 * @param {string} webhookUrl - Mattermost webhook URL
 * @param {string} message - Message text
 * @param {Object} props - Optional additional properties
 * @returns {Object} Result with success status
 */
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