import React, { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';
import { Box, Typography, Chip, Avatar, Badge } from '@mui/material';
import { useSelector } from 'react-redux';
import { 
  joinCollaborativeSession, 
  leaveCollaborativeSession,
  sendContentUpdate,
  onContentUpdate,
  onCollaboratorUpdate,
  removeCollaborationListeners
} from '../../services/socketService';

const CollaborativeEditor = ({ taskId, initialContent, onChange, readOnly = false }) => {
  const [content, setContent] = useState(initialContent || '');
  const [collaborators, setCollaborators] = useState([]);
  const [lastUpdateBy, setLastUpdateBy] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useSelector(state => state.auth);
  
  useEffect(() => {
    // Initialize with the initial content
    setContent(initialContent || '');
    
    if (!taskId || readOnly) return;
    
    // Join collaborative session
    joinCollaborativeSession(taskId, user?.userId);
    
    // Set up listeners
    onContentUpdate((data) => {
      // Only update if the change came from someone else
      if (data.userId !== user?.userId) {
        setContent(data.content);
        setLastUpdateBy(data.userId);
        
        // If there's a parent component callback
        if (onChange) {
          onChange(data.content);
        }
      }
    });
    
    onCollaboratorUpdate((data) => {
      setCollaborators(data.collaborators);
    });
    
    // Clean up on unmount
    return () => {
      if (taskId) {
        leaveCollaborativeSession(taskId, user?.userId);
        removeCollaborationListeners();
      }
    };
  }, [taskId, user?.userId, initialContent, readOnly, onChange]);
  
  // Handle content changes
  const handleContentChange = (newContent) => {
    setContent(newContent);
    
    // If not typing, indicate we're typing
    if (!isTyping) {
      setIsTyping(true);
      
      // After a delay, send the update
      setTimeout(() => {
        sendContentUpdate(taskId, newContent, user?.userId);
        setIsTyping(false);
      }, 500);
    }
    
    // If there's a parent component callback
    if (onChange) {
      onChange(newContent);
    }
  };
  
  return (
    <Box sx={{ position: 'relative' }}>
      {collaborators.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Current collaborators:
          </Typography>
          {collaborators
            .filter(c => c.userId !== user?.userId) // Don't show self
            .map((collaborator) => (
              <Chip
                key={collaborator.userId}
                avatar={
                  <Avatar alt={collaborator.name || 'User'}>
                    {(collaborator.name || 'U').charAt(0)}
                  </Avatar>
                }
                label={collaborator.name || 'Unknown User'}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
        </Box>
      )}
      
      <RichTextEditor 
        content={content} 
        onChange={handleContentChange}
        readOnly={readOnly}
      />
      
      {lastUpdateBy && lastUpdateBy !== user?.userId && (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
          Last edited by {collaborators.find(c => c.userId === lastUpdateBy)?.name || 'another user'}
        </Typography>
      )}
    </Box>
  );
};

export default CollaborativeEditor;