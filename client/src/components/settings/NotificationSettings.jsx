import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Button, 
  Alert, 
  Paper, 
  Divider, 
  CircularProgress 
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { 
  arePushNotificationsSupported, 
  checkNotificationPermission, 
  subscribeToPushNotifications,
  testPushNotification 
} from '../../services/pushNotificationService';
import { useAuth } from '../../contexts/AuthContext';

const NotificationSettings = () => {
  const { token } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    const checkSupport = async () => {
      const supported = arePushNotificationsSupported();
      setIsSupported(supported);
      
      if (supported) {
        const currentPermission = await checkNotificationPermission();
        setPermission(currentPermission);
      }
    };
    
    checkSupport();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await subscribeToPushNotifications(token);
      
      if (result.success) {
        setSuccess(true);
        // Update permission state
        const currentPermission = await checkNotificationPermission();
        setPermission(currentPermission);
      } else {
        setError(result.error || 'Failed to subscribe to notifications');
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setTestSuccess(false);
    
    try {
      const result = await testPushNotification(token);
      
      if (result.success) {
        setTestSuccess(true);
        setTimeout(() => setTestSuccess(false), 5000);
      } else {
        setError(result.error || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Error testing notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <NotificationsIcon sx={{ mr: 1 }} />
        <Typography variant="h6">Push Notifications</Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {!isSupported ? (
        <Alert severity="warning">
          Push notifications are not supported in your browser.
        </Alert>
      ) : permission === 'granted' ? (
        <Alert severity="success">
          Push notifications are enabled! You'll receive notifications for important updates.
        </Alert>
      ) : (
        <Alert severity="info">
          Enable push notifications to receive updates about your tasks, deadlines, and team activity.
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Successfully subscribed to push notifications!
        </Alert>
      )}
      
      {testSuccess && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Test notification sent successfully. You should receive it shortly.
        </Alert>
      )}
      
      <Box sx={{ mt: 3 }}>
        {isSupported && (
          permission === 'granted' ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                You're all set! Your browser will display notifications from TaskFlow.
              </Typography>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={handleTest}
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Sending...' : 'Test Notification'}
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubscribe}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} />}
            >
              {loading ? 'Enabling...' : 'Enable Push Notifications'}
            </Button>
          )
        )}
      </Box>
    </Paper>
  );
};

export default NotificationSettings;