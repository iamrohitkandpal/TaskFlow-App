import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  LinearProgress, 
  Divider, 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar,
  ListItemText,
  Tooltip
} from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import WarningIcon from '@mui/icons-material/Warning';

const UserWipLimits = ({ projectId }) => {
  const [userLimits, setUserLimits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWipLimits = async () => {
      setLoading(true);
      try {
        // First get project members
        const membersResponse = await axios.get(`${API_BASE_URL}/projects/${projectId}/members`);
        
        if (membersResponse.data.status) {
          const members = membersResponse.data.members;
          
          // For each member, get their WIP limit status
          const limits = await Promise.all(
            members.map(async (member) => {
              const limitResponse = await axios.get(
                `${API_BASE_URL}/tasks/wip-limit/${member._id}`,
                { params: { maxTasksInProgress: member.wipLimit || 3 } }
              );
              
              return {
                user: member,
                ...limitResponse.data
              };
            })
          );
          
          setUserLimits(limits);
        }
      } catch (err) {
        console.error('Error fetching WIP limits:', err);
        setError('Failed to load WIP limits');
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchWipLimits();
    }
  }, [projectId]);
  
  if (loading) {
    return <Box sx={{ width: '100%' }}><LinearProgress /></Box>;
  }
  
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Team WIP Limits</Typography>
      <Divider sx={{ mb: 2 }} />
      
      <List>
        {userLimits.map((item) => (
          <ListItem key={item.user._id} sx={{ 
            mb: 1, 
            bgcolor: item.isLimitExceeded ? 'warning.light' : 'background.default',
            borderRadius: 1
          }}>
            <ListItemAvatar>
              <Avatar alt={item.user.name} src={item.user.avatar || ''}>
                {item.user.name.charAt(0)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText 
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1">{item.user.name}</Typography>
                  {item.isLimitExceeded && (
                    <Tooltip title="WIP limit exceeded">
                      <WarningIcon color="error" sx={{ ml: 1, fontSize: '1rem' }} />
                    </Tooltip>
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption">Tasks in progress</Typography>
                    <Typography variant="caption">
                      {item.currentCount}/{item.limit}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(item.currentCount / item.limit) * 100}
                    color={item.isLimitExceeded ? "error" : "primary"}
                  />
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default UserWipLimits;