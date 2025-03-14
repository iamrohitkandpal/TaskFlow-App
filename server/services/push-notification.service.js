import webpush from 'web-push';
import User from '../models/user.model.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Generate VAPID keys if not already present
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const vapidKeysPath = path.join(__dirname, '../vapid-keys.json');

let vapidKeys;
try {
  if (fs.existsSync(vapidKeysPath)) {
    const keysData = fs.readFileSync(vapidKeysPath);
    vapidKeys = JSON.parse(keysData);
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(vapidKeysPath, JSON.stringify(vapidKeys));
  }
} catch (error) {
  console.error('Error handling VAPID keys:', error);
  vapidKeys = webpush.generateVAPIDKeys();
}

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:contact@taskflow.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Save push subscription for a user
export const saveSubscription = async (userId, subscription) => {
  try {
    await User.findByIdAndUpdate(userId, {
      pushSubscription: subscription
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return { success: false, error: error.message };
  }
};

// Send notification to a specific user
export const sendNotificationToUser = async (userId, notification) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.pushSubscription) {
      return { success: false, reason: 'no-subscription' };
    }
    
    const subscription = user.pushSubscription;
    const payload = JSON.stringify(notification);
    
    await webpush.sendNotification(subscription, payload);
    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    // Check for expired or invalid subscription
    if (error.statusCode === 410) {
      // Subscription has expired or is no longer valid
      await User.findByIdAndUpdate(userId, {
        pushSubscription: null
      });
      return { success: false, reason: 'subscription-expired' };
    }
    
    return { success: false, error: error.message };
  }
};

// Send notification to multiple users
export const sendNotificationToMany = async (userIds, notification) => {
  const results = [];
  
  for (const userId of userIds) {
    const result = await sendNotificationToUser(userId, notification);
    results.push({ userId, ...result });
  }
  
  return results;
};

// Get VAPID public key for client subscription
export const getPublicVapidKey = () => {
  return vapidKeys.publicKey;
};