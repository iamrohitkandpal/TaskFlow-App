import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Function to register the service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('ServiceWorker registration successful with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
      throw error;
    }
  } else {
    throw new Error('Service workers are not supported by this browser');
  }
};

// Function to check if push notifications are supported
export const arePushNotificationsSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Function to check if notifications are permitted
export const checkNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  
  return Notification.permission;
};

// Function to request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
};

// Function to subscribe to push notifications
export const subscribeToPushNotifications = async (token) => {
  try {
    if (!arePushNotificationsSupported()) {
      throw new Error('Push notifications are not supported by this browser');
    }
    
    // Request permission first
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted');
    }
    
    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Get the VAPID public key from the server
    const response = await axios.get(`${API_BASE_URL}/push-notifications/vapid-public-key`);
    const publicKey = response.data.publicKey;
    
    // Convert the public key to a Uint8Array
    const convertedPublicKey = urlBase64ToUint8Array(publicKey);
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedPublicKey
    });
    
    // Send the subscription to the server
    await axios.post(
      `${API_BASE_URL}/push-notifications/subscribe`, 
      subscription, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return { success: false, error: error.message };
  }
};

// Function to test push notifications
export const testPushNotification = async (token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/push-notifications/test`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error testing push notifications:', error);
    return { success: false, error: error.message };
  }
};

// Helper function to convert VAPID public key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}