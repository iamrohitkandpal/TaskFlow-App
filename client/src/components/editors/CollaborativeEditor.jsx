import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Editor, EditorState, ContentState, RichUtils, convertToRaw, convertFromRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';
import socket from '../../services/socketService';
import { toast } from 'sonner';
import { Box, Paper, Typography, Divider, Avatar, Chip } from '@mui/material';
import { API_BASE_URL } from '../../config/constants';
import axios from 'axios';

const CollaborativeEditor = ({ taskId, initialContent, readOnly = false }) => {
  const [editorState, setEditorState] = useState(() => {
    if (initialContent) {
      try {
        // Try to parse it as raw JSON content
        const content = JSON.parse(initialContent);
        return EditorState.createWithContent(convertFromRaw(content));
      } catch (e) {
        // If parsing fails, treat it as plain text
        return EditorState.createWithContent(ContentState.createFromText(initialContent));
      }
    }
    return EditorState.createEmpty();
  });
  
  const [collaborators, setCollaborators] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef(null);
  const user = useSelector(state => state.auth.user);
  const { token } = useSelector(state => state.auth);
  
  // Connect to socket room when component mounts
  useEffect(() => {
    if (!taskId || !user?._id || readOnly) return;
    
    // Join collaborative session
    socket.emit('join-document', {
      documentId: taskId,
      userId: user._id,
      userName: user.name
    });
    
    setIsConnected(true);
    
    // Listen for document changes from other users
    socket.on('document-change', (data) => {
      if (data.userId !== user._id) {
        try {
          const contentState = convertFromRaw(data.content);
          setEditorState(EditorState.createWithContent(contentState));
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
  }, [taskId, user, readOnly]);
  
  // Broadcast changes when user types
  const onChange = (newState) => {
    setEditorState(newState);
    
    if (isConnected && !readOnly) {
      const contentState = newState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      
      // Broadcast changes to other users
      socket.emit('document-change', {
        documentId: taskId,
        content: rawContent,
        userId: user?._id
      });
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };
  
  // Focus the editor when clicking on the container
  const focusEditor = () => {
    if (editorRef.current && !readOnly) {
      editorRef.current.focus();
    }
  };
  
  // Save content to server
  const saveContent = async () => {
    if (readOnly) return;
    
    try {
      setIsSaving(true);
      const contentState = editorState.getCurrentContent();
      const rawContent = JSON.stringify(convertToRaw(contentState));
      
      await axios.patch(
        `${API_BASE_URL}/tasks/${taskId}/description`, 
        { description: rawContent },
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
      
      <div 
        onClick={focusEditor}
        className={`editor-container ${readOnly ? 'read-only' : ''}`}
        style={{ minHeight: '150px' }}
      >
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={onChange}
          handleKeyCommand={handleKeyCommand}
          placeholder="Enter task description..."
          readOnly={readOnly}
        />
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