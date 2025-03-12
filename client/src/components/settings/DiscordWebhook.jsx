import React, { useState, useEffect } from 'react';
import { TextField, Button, Switch, FormControlLabel, Box, Typography, Alert, Divider, CircularProgress } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const DiscordWebhook = ({ projectId }) => {
  const { token } = useAuth();
  const [webhook, setWebhook] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [testStatus, setTestStatus] = useState(null);
  
  // Event settings
  const [events, setEvents] = useState({
    taskCreated: true,
    taskUpdated: true,
    taskCompleted: true,
    commentAdded: true
  });

  // Load existing webhook settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const endpoint = projectId 
          ? `/api/notifications/project/${projectId}`
          : '/api/notifications/user';
          
        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.status) {
          const { notifications } = response.data;
          if (notifications) {
            setWebhook(notifications.webhook || '');
            setEnabled(notifications.enabled !== false);
            setEvents(prev => ({
              ...prev,
              ...(notifications.events || {})
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load notification settings:', err);
        setError('Failed to load settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [token, projectId]);

  // Handle event toggle
  const handleEventToggle = (event) => {
    setEvents({
      ...events,
      [event.target.name]: event.target.checked
    });
  };

  // Save webhook settings
  const saveSettings = async () => {
    setLoading(true);
    setSaveSuccess(false);
    setError(null);
    setTestStatus(null);
    
    try {
      const endpoint = projectId 
        ? `/api/notifications/project/${projectId}`
        : '/api/notifications/user';
        
      const response = await axios.post(endpoint, {
        webhook,
        enabled,
        events
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status) {
        setSaveSuccess(true);
        if (response.data.testResult) {
          setTestStatus(response.data.testResult.success 
            ? 'success' 
            : 'error');
        }
      } else {
        setError(response.data.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save webhook:', err);
      setError('Failed to save webhook. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 2, p: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Discord Notification Settings
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Enter your Discord webhook URL to receive notifications about task updates and comments.
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings saved successfully!
        </Alert>
      )}
      
      {testStatus === 'success' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Test notification sent successfully! Check your Discord channel.
        </Alert>
      )}
      
      {testStatus === 'error' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Failed to send test notification. Please verify your webhook URL.
        </Alert>
      )}
      
      <TextField
        fullWidth
        label="Discord Webhook URL"
        variant="outlined"
        value={webhook}
        onChange={(e) => setWebhook(e.target.value)}
        placeholder="https://discord.com/api/webhooks/..."
        margin="normal"
        helperText="Create a webhook URL in your Discord server settings"
      />
      
      <FormControlLabel
        control={
          <Switch 
            checked={enabled} 
            onChange={(e) => setEnabled(e.target.checked)}
            color="primary"
          />
        }
        label="Enable notifications"
        sx={{ mt: 1 }}
      />
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Notification Events
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1 }}>
        <FormControlLabel
          control={
            <Switch 
              checked={events.taskCreated} 
              onChange={handleEventToggle}
              name="taskCreated"
              color="primary"
            />
          }
          label="Task Created"
        />
        
        <FormControlLabel
          control={
            <Switch 
              checked={events.taskUpdated} 
              onChange={handleEventToggle}
              name="taskUpdated"
              color="primary"
            />
          }
          label="Task Updated"
        />
        
        <FormControlLabel
          control={
            <Switch 
              checked={events.taskCompleted} 
              onChange={handleEventToggle}
              name="taskCompleted"
              color="primary"
            />
          }
          label="Task Completed"
        />
        
        <FormControlLabel
          control={
            <Switch 
              checked={events.commentAdded} 
              onChange={handleEventToggle}
              name="commentAdded"
              color="primary"
            />
          }
          label="Comment Added"
        />
      </Box>
      
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={saveSettings}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? 'Saving...' : 'Save & Test Webhook'}
        </Button>
      </Box>
    </Box>
  );
};

export default DiscordWebhook;