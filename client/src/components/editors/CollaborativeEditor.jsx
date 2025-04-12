import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import { Box, Paper, Typography, Divider, Avatar, Chip } from '@mui/material';
import { API_BASE_URL } from '../../config/constants';
import axios from 'axios';
import socket from '../../services/socketService';
import { toast } from 'sonner';

const CollaborativeEditor = ({ taskId, initialContent, readOnly = false }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const user = useSelector(state => state.auth.user);
  const { token } = useSelector(state => state.auth);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem,
      Image
    ],
    editable: !readOnly,
    content: initialContent || '<p>Enter task description...</p>',
    onUpdate: ({ editor }) => {
      if (isConnected && !readOnly) {
        const content = editor.getHTML();
        
        // Broadcast changes to other users
        socket.emit('document-change', {
          documentId: taskId,
          content,
          userId: user?._id
        });
      }
    }
  });
  
  // Connect to socket room when component mounts
  useEffect(() => {
    if (!taskId || !user?._id || readOnly || !editor) return;
    
    // Join collaborative session
    socket.emit('join-document', {
      documentId: taskId,
      userId: user._id,
      userName: user.name
    });
    
    setIsConnected(true);
    
    // Listen for document changes from other users
    socket.on('document-change', (data) => {
      if (data.userId !== user._id && editor) {
        try {
          // Need to disable onUpdate temporarily to prevent infinite loops
          const currentSelection = editor.state.selection;
          editor.commands.setContent(data.content, false);
          editor.commands.setTextSelection(currentSelection);
        } catch (err) {
          console.error('Error applying remote changes:', err);
        }
      }
    });
    
    // Listen for collaborator updates
    socket.on('collaborator-update', (data) => {
      setCollaborators(data.collaborators);
    });
    
    return () => {
      socket.emit('leave-document', { documentId: taskId, userId: user._id });
      socket.off('document-change');
      socket.off('collaborator-update');
    };
  }, [taskId, user, readOnly, editor]);
  
  // Save content to server
  const saveContent = async () => {
    if (readOnly || !editor) return;
    
    try {
      setIsSaving(true);
      const content = editor.getHTML();
      
      await axios.patch(
        `${API_BASE_URL}/tasks/${taskId}/description`,
        { description: content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Description saved successfully');
    } catch (err) {
      console.error('Error saving description:', err);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
      {collaborators.length > 0 && !readOnly && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="textSecondary">Collaborating with:</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            {collaborators.map(c => c.userId !== user?._id && (
              <Chip
                key={c.userId}
                size="small"
                label={c.name}
                avatar={<Avatar sx={{ bgcolor: '#3498db' }}>{c.name[0]}</Avatar>}
              />
            ))}
          </Box>
          <Divider sx={{ my: 1 }} />
        </Box>
      )}
      
      <div className={`editor-container ${readOnly ? 'read-only' : ''}`}>
        <EditorContent editor={editor} />
      </div>
      
      {!readOnly && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <button 
            onClick={saveContent}
            disabled={isSaving}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </Box>
      )}
    </Paper>
  );
};

export default CollaborativeEditor;