import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { 
  Paper, Typography, Box, Alert, CircularProgress, 
  List, ListItem, ListItemText, Divider, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Dialog, DialogActions, DialogContent, DialogTitle, 
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const TaskDependenciesPanel = ({ projectId }) => {
  const [tasks, setTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState('');
  const [dependsOn, setDependsOn] = useState('');
  const { token } = useSelector(state => state.auth);
  
  useEffect(() => {
    fetchData();
  }, [projectId, token]);
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tasks
      const tasksResponse = await axios.get(`${API_BASE_URL}/projects/${projectId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch dependencies
      const dependenciesResponse = await axios.get(`${API_BASE_URL}/projects/${projectId}/dependencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (tasksResponse.data.status && dependenciesResponse.data.status) {
        setTasks(tasksResponse.data.tasks || []);
        setDependencies(dependenciesResponse.data.dependencies || []);
      } else {
        setError('Failed to load tasks or dependencies');
      }
    } catch (err) {
      console.error('Error fetching dependencies data:', err);
      setError('An error occurred while loading dependencies data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddDependency = async () => {
    if (!selectedTask || !dependsOn || selectedTask === dependsOn) {
      return;
    }
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/tasks/${selectedTask}/dependencies`, 
        { dependsOn },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status) {
        fetchData(); // Refresh data
        handleCloseDialog();
      } else {
        setError('Failed to add dependency');
      }
    } catch (err) {
      console.error('Error adding dependency:', err);
      setError('An error occurred while adding the dependency');
    }
  };
  
  const handleRemoveDependency = async (taskId, dependencyId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/tasks/${taskId}/dependencies/${dependencyId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status) {
        fetchData(); // Refresh data
      } else {
        setError('Failed to remove dependency');
      }
    } catch (err) {
      console.error('Error removing dependency:', err);
      setError('An error occurred while removing the dependency');
    }
  };
  
  const handleOpenDialog = () => {
    setSelectedTask('');
    setDependsOn('');
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const getTaskById = (id) => {
    return tasks.find(task => task._id === id) || { title: 'Unknown Task' };
  };
  
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
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Task Dependencies
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={handleOpenDialog}
            size="small"
          >
            Add Dependency
          </Button>
        </Box>
        
        <Typography variant="body1" paragraph>
          Task dependencies determine the order in which tasks must be completed.
        </Typography>
      </Paper>
      
      {dependencies.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No dependencies defined for this project.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Depends On</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dependencies.map((dep) => (
                <TableRow key={`${dep.taskId}-${dep.dependsOn}`}>
                  <TableCell>{getTaskById(dep.taskId).title}</TableCell>
                  <TableCell>{getTaskById(dep.dependsOn).title}</TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleRemoveDependency(dep.taskId, dep.dependsOn)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Add Dependency Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add Task Dependency</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, minWidth: 400 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Task</InputLabel>
              <Select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                label="Task"
              >
                {tasks.map((task) => (
                  <MenuItem key={task._id} value={task._id}>
                    {task.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Depends On</InputLabel>
              <Select
                value={dependsOn}
                onChange={(e) => setDependsOn(e.target.value)}
                label="Depends On"
                disabled={!selectedTask}
              >
                {tasks
                  .filter(task => task._id !== selectedTask)
                  .map((task) => (
                    <MenuItem key={task._id} value={task._id}>
                      {task.title}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleAddDependency}
            variant="contained"
            disabled={!selectedTask || !dependsOn || selectedTask === dependsOn}
          >
            Add Dependency
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskDependenciesPanel;