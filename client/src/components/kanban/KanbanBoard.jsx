import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Box, Typography, Divider, Paper, Alert, Snackbar } from '@mui/material';
import KanbanColumn from './KanbanColumn';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import UserWipLimits from './UserWipLimits';
import { useUpdateTaskStatusMutation } from '../../features/tasks/taskApiSlice';

const KanbanBoard = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState(['Uncategorized']);
  const [columns] = useState(['todo', 'in-progress', 'review', 'completed']);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [updateTaskStatus] = useUpdateTaskStatusMutation();

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/tasks`, {
          params: { projectId, isTrashed: false }
        });
        
        if (response.data.status) {
          setTasks(response.data.tasks);
          
          // Extract unique categories from tasks
          const uniqueCategories = [...new Set(
            response.data.tasks
              .map(task => task.category || 'Uncategorized')
              .filter(Boolean)
          )];
          
          setCategories(
            uniqueCategories.length > 0 
              ? uniqueCategories 
              : ['Uncategorized']
          );
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]);

  // Fix the handleDragEnd function with optimistic updates and rollback
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // No change or dropped outside valid area
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    try {
      // Extract the new status from the destination droppableId
      const newStatus = destination.droppableId.split('-')[1];
      
      // Check WIP limit if moving to in-progress
      if (newStatus === 'in-progress') {
        try {
          const wipResponse = await axios.get(
            `${API_BASE_URL}/tasks/user/${user._id}/wip-limit`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (wipResponse.data.isLimitExceeded) {
            setNotification({
              open: true,
              message: `Work-in-progress limit reached (${wipResponse.data.limit} tasks). Please complete existing tasks first.`,
              severity: 'warning'
            });
            return; // Don't proceed with the move
          }
        } catch (err) {
          console.warn('Error checking WIP limit:', err);
          // Continue anyway since this is a non-critical check
        }
      }
      
      // Save the original task for rollback
      const originalTask = tasks.find(t => t._id === draggableId);
      
      // Optimistic update in UI
      setTasks(tasks.map(task => 
        task._id === draggableId 
          ? { ...task, stage: newStatus } 
          : task
      ));
      
      // Update task status on the server
      await updateTaskStatus({ id: draggableId, status: newStatus }).unwrap();
      
      setNotification({
        open: true,
        message: `Task moved to ${newStatus.replace('-', ' ')}`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating task status:', err);
      
      // Roll back the optimistic update
      setTasks(prevTasks => [...prevTasks]);
      
      setNotification({
        open: true,
        message: 'Failed to update task. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  if (loading) {
    return <Box sx={{ p: 3, textAlign: 'center' }}>Loading tasks...</Box>;
  }

  if (error) {
    return <Box sx={{ p: 3, color: 'error.main' }}>{error}</Box>;
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Display team WIP limits */}
      <UserWipLimits projectId={projectId} />
      
      <DragDropContext onDragEnd={handleDragEnd}>
        {categories.map(category => (
          <Box key={category} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {category}
            </Typography>
            
            <div className="overflow-x-auto pb-4 flex flex-col md:flex-row">
              {columns.map(column => {
                const columnTasks = tasks.filter(
                  task => 
                    task.stage === column && 
                    (task.category || 'Uncategorized') === category
                );
                
                return (
                  <KanbanColumn 
                    key={`column-${column}-${category}`} 
                    column={column} 
                    tasks={tasks} 
                    category={category} 
                  />
                );
              })}
            </div>
          </Box>
        ))}
      </DragDropContext>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KanbanBoard;