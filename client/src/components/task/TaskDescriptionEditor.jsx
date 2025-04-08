import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button, Box, Typography } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import socket from '../../services/socketService';

const TaskDescriptionEditor = ({ taskId, initialContent, onUpdate }) => {
  const [collaborators, setCollaborators] = useState([]);
  const user = useSelector(state => state.auth.user);
  const { token } = useSelector(state => state.auth);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Send content update via socket
      socket.emit('content-update', {
        taskId,
        content: html,
        userId: user?._id,
        userName: user?.name
      });
      
      // Call update handler
      onUpdate(html);
    }
  });
  
  useEffect(() => {
    if (!taskId || !user?._id) return;
    
    // Join the collaborative session
    socket.emit('join-collaborative-session', {
      taskId,
      userId: user._id,
      userName: user.name
    });
    
    // Listen for content updates from other users
    socket.on('content-update', (data) => {
      // Only update if from another user
      if (data.userId !== user._id && editor) {
        editor.commands.setContent(data.content, false);
      }
    });
    
    // Listen for collaborator updates
    socket.on('collaborator-update', (data) => {
      setCollaborators(data.collaborators);
    });
    
    return () => {
      // Leave the session when component unmounts
      socket.emit('leave-collaborative-session', { taskId, userId: user._id });
      socket.off('content-update');
      socket.off('collaborator-update');
    };
  }, [taskId, user, editor]);
  
  const handleSave = async () => {
    if (!taskId) return;
    
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/tasks/${taskId}/description`, 
        { description: editor.getHTML() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status) {
        toast.success('Task description updated successfully');
        if (onUpdate) onUpdate(editor.getHTML());
      } else {
        toast.error(response.data.message || 'Failed to update description');
      }
    } catch (error) {
      console.error('Error updating task description:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Task Description
      </Typography>
      
      <div className="relative">
        {collaborators.length > 0 && (
          <div className="mb-2 flex items-center gap-1">
            <span className="text-sm text-gray-500">Collaborating with:</span>
            {collaborators.map(c => c.userId !== user?._id && (
              <div key={c.userId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {c.name}
              </div>
            ))}
          </div>
        )}
        <EditorContent editor={editor} className="prose max-w-none border rounded-md p-3" />
      </div>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          onClick={handleSave}
        >
          Save Description
        </Button>
      </Box>
    </Box>
  );
};

export default TaskDescriptionEditor;