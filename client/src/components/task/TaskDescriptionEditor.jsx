import React, { useState, useEffect } from 'react';
import RichTextEditor from '../editors/RichTextEditor';
import { Button, Box, Typography } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

const TaskDescriptionEditor = ({ taskId, initialContent, onSave }) => {
  const [content, setContent] = useState(initialContent || '');
  const [isSaving, setIsSaving] = useState(false);
  const { token } = useSelector(state => state.auth);
  
  useEffect(() => {
    setContent(initialContent || '');
  }, [initialContent]);
  
  const handleSave = async () => {
    if (!taskId) return;
    
    setIsSaving(true);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/tasks/${taskId}/description`, 
        { description: content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status) {
        toast.success('Task description updated successfully');
        if (onSave) onSave(content);
      } else {
        toast.error(response.data.message || 'Failed to update description');
      }
    } catch (error) {
      console.error('Error updating task description:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Task Description
      </Typography>
      
      <RichTextEditor 
        content={content} 
        onChange={setContent}
        placeholder="Enter detailed task description here..."
      />
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Description'}
        </Button>
      </Box>
    </Box>
  );
};

export default TaskDescriptionEditor;