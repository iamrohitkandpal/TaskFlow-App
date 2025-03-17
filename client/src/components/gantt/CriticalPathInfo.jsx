import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { 
  Paper, Typography, Box, Alert, CircularProgress, 
  List, ListItem, ListItemText, Divider, Chip
} from '@mui/material';
import { format } from 'date-fns';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';

const CriticalPathInfo = ({ projectId }) => {
  const [criticalPath, setCriticalPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector(state => state.auth);
  
  useEffect(() => {
    const fetchCriticalPath = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/critical-path`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.status) {
          setCriticalPath(response.data.criticalPath || []);
        } else {
          setError('Failed to load critical path data');
        }
      } catch (err) {
        console.error('Error fetching critical path:', err);
        setError('An error occurred while loading the critical path');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCriticalPath();
  }, [projectId, token]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (criticalPath.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <InfoIcon sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
        <Typography>
          No critical path found for this project. This could mean there are no task dependencies defined.
        </Typography>
      </Paper>
    );
  }
  
  const projectDuration = criticalPath.reduce((total, task) => total + (task.duration || 0), 0);
  const riskyTasks = criticalPath.filter(task => task.risk === 'high');
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Critical Path Analysis
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            This path determines the minimum project duration. Any delay in these tasks will delay the entire project.
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            icon={<InfoIcon />} 
            label={`Project Duration: ${projectDuration} days`} 
            color="primary" 
          />
          {riskyTasks.length > 0 && (
            <Chip 
              icon={<WarningIcon />} 
              label={`${riskyTasks.length} High Risk Tasks`} 
              color="warning" 
            />
          )}
        </Box>
      </Paper>
      
      <Paper sx={{ overflow: 'hidden' }}>
        <List>
          {criticalPath.map((task, index) => (
            <React.Fragment key={task._id}>
              {index > 0 && <Divider />}
              <ListItem 
                sx={{ 
                  bgcolor: task.risk === 'high' ? 'error.light' : 'inherit',
                  '&:hover': { bgcolor: task.risk === 'high' ? 'error.200' : 'action.hover' }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" component="span">
                        {index + 1}. {task.title}
                      </Typography>
                      {task.risk === 'high' && <WarningIcon color="error" fontSize="small" />}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                        Duration: {task.duration} days
                      </Typography>
                      <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                        Due: {task.dueDate ? format(new Date(task.dueDate), 'PPP') : 'Not set'}
                      </Typography>
                      {task.assignee && (
                        <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                          Assigned to: {task.assignee.name}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default CriticalPathInfo;