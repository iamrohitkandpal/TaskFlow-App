import {
  saveSubscription,
  sendNotificationToUser,
  sendNotificationToMany,
  getPublicVapidKey
} from '../services/push-notification.service.js';

// Controller to save a user's push subscription
export const savePushSubscription = async (req, res) => {
  try {
    const { userId } = req.user;
    const subscription = req.body;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        status: false,
        message: 'Invalid subscription object'
      });
    }
    
    const result = await saveSubscription(userId, subscription);
    
    if (result.success) {
      res.status(200).json({
        status: true,
        message: 'Push subscription saved successfully'
      });
    } else {
      res.status(500).json({
        status: false,
        message: 'Failed to save push subscription'
      });
    }
  } catch (error) {
    console.error('Error in savePushSubscription:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while saving push subscription'
    });
  }
};

// Controller to get the VAPID public key
export const getVapidPublicKey = (req, res) => {
  try {
    const publicKey = getPublicVapidKey();
    
    res.status(200).json({
      status: true,
      publicKey
    });
  } catch (error) {
    console.error('Error in getVapidPublicKey:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while getting VAPID public key'
    });
  }
};

// Controller to test push notification
export const testPushNotification = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const result = await sendNotificationToUser(userId, {
      title: 'TaskFlow Test Notification',
      body: 'This is a test notification from TaskFlow.',
      data: {
        url: '/dashboard'
      }
    });
    
    if (result.success) {
      res.status(200).json({
        status: true,
        message: 'Test notification sent successfully'
      });
    } else if (result.reason === 'no-subscription') {
      res.status(400).json({
        status: false,
        message: 'No push subscription found for this user'
      });
    } else if (result.reason === 'subscription-expired') {
      res.status(410).json({
        status: false,
        message: 'Push subscription has expired or is invalid'
      });
    } else {
      res.status(500).json({
        status: false,
        message: 'Failed to send test notification'
      });
    }
  } catch (error) {
    console.error('Error in testPushNotification:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while sending test notification'
    });
  }
};