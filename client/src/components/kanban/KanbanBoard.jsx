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

  const handleDragEnd = async (result) => {
    if (!result.destination) return; // Dropped outside the list
    
    const { source, destination, draggableId } = result;
    
    // Check if task moved to a different column
    if (source.droppableId !== destination.droppableId) {
      try {
        // Get the column ID (status) from the droppableId
        // Format is "column-{status}-{category}"
        const newStatus = destination.droppableId.split('-')[1];
        
        // Find the task that was moved
        const movedTask = tasks.find(task => task._id === draggableId);
        
        if (!movedTask) return;
        
        // Check WIP limits if moving to in-progress
        if (newStatus === 'in-progress' && movedTask.assignee) {
          const wipCheck = await axios.get(
            `${API_BASE_URL}/tasks/wip-limit/${movedTask.assignee._id || movedTask.assignee}`
          );
          
          if (wipCheck.data.isLimitExceeded) {
            setNotification({
              open: true,
              message: `WIP limit exceeded for ${movedTask.assignee.name || 'assigned user'}. Task not moved.`,
              severity: 'warning'
            });
            return; // Don't proceed with the move
          }
        }
        
        // Update task status on the server
        await updateTaskStatus({ id: draggableId, status: newStatus }).unwrap();
        
        // Extract the category from droppableId
        const newCategory = destination.droppableId.split('-')[2];
        
        // Update local state
        setTasks(tasks.map(task => 
          task._id === draggableId 
            ? { ...task, stage: newStatus, category: newCategory !== 'Uncategorized' ? newCategory : null } 
            : task
        ));
        
        setNotification({
          open: true,
          message: `Task moved to ${newStatus.replace('-', ' ')}`,
          severity: 'success'
        });
      } catch (err) {
        console.error('Error updating task status:', err);
        setNotification({
          open: true,
          message: 'Failed to update task. Please try again.',
          severity: 'error'
        });
      }
    } else if (source.index !== destination.index) {
      // Task reordered within the same column - update task priority
      // This would require an API to update task order/priority
      // For now, just update the UI
      const reorderedTasks = Array.from(tasks);
      const movedTask = reorderedTasks.find(task => task._id === draggableId);
      
      // Remove the task from its position
      const filteredTasks = reorderedTasks.filter(task => task._id !== draggableId);
      
      // Find all tasks in the same column
      const columnTasks = filteredTasks.filter(
        t => t.stage === movedTask.stage && 
             (t.category || 'Uncategorized') === (movedTask.category || 'Uncategorized')
      );
      
      // Insert the task at new position
      columnTasks.splice(destination.index, 0, movedTask);
      
      // Update the tasks array
      setTasks([
        ...filteredTasks.filter(
          t => t.stage !== movedTask.stage || 
               (t.category || 'Uncategorized') !== (movedTask.category || 'Uncategorized')
        ),
        ...columnTasks
      ]);
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