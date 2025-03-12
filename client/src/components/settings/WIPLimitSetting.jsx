import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Slider, 
  Box, 
  Button, 
  CircularProgress,
  Alert
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

const WIPLimitSetting = () => {
  const [wipLimit, setWipLimit] = useState(3);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/user-settings`);
        
        if (response.data.status) {
          setWipLimit(response.data.settings.wipLimit);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load your current settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleSaveLimit = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await axios.put(`${API_BASE_URL}/user-settings`, {
        wipLimit
      });
      
      if (response.data.status) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save your settings');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Work In Progress (WIP) Limit
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set the maximum number of tasks you can have in progress at once.
          This helps maintain focus and improve productivity.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            WIP limit updated successfully!
          </Alert>
        )}
        
        <Box sx={{ px: 2, py: 1 }}>
          <Slider
            value={wipLimit}
            onChange={(_, newValue) => setWipLimit(newValue)}
            step={1}
            marks
            min={1}
            max={10}
            valueLabelDisplay="on"
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Low Limit = High Focus
            </Typography>
            <Typography variant="body2" color="text.secondary">
              High Limit = More Flexibility
            </Typography>
          </Box>
        </Box>
        
        <Button
          variant="contained"
          onClick={handleSaveLimit}
          disabled={saving}
          sx={{ mt: 2 }}
        >
          {saving ? <CircularProgress size={24} /> : 'Save Limit'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WIPLimitSetting;