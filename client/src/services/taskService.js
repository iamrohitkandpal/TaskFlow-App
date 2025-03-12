import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import * as OfflineStorage from './offlineStorage';

// Helper to handle offline operations
const handleOfflineOperation = async (operation) => {
  // Store operation in queue for later synchronization
  await OfflineStorage.addToSyncQueue(operation);
  
  // For create/update operations, also update the local cache
  if (operation.type === 'CREATE_TASK' || operation.type === 'UPDATE_TASK') {
    const task = operation.data;
    
    // Add temporary ID for new tasks
    if (operation.type === 'CREATE_TASK' && !task._id) {
      task._id = `temp-${Date.now()}`;
    }
    
    await OfflineStorage.saveTasks([task]);
  } else if (operation.type === 'DELETE_TASK') {
    await OfflineStorage.deleteTask(operation.id);
  }
  
  return { status: true, offline: true };
};

export const fetchTasks = async (projectId, isOnline) => {
  if (isOnline) {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks`, {
        params: { projectId, isTrashed: false }
      });
      
      if (response.data.status) {
        // Cache tasks locally for offline use
        await OfflineStorage.saveTasks(response.data.tasks);
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }
  
  // If offline or API call failed, get from local storage
  const tasks = await OfflineStorage.getTasksByProject(projectId);
  return { status: true, tasks, offline: true };
};

export const createTask = async (taskData, isOnline) => {
  if (isOnline) {
    try {
      const response = await axios.post(`${API_BASE_URL}/tasks`, taskData);
      
      if (response.data.status) {
        // Cache the created task
        await OfflineStorage.saveTasks([response.data.task]);
        return response.data;
      }
    } catch (error) {
      console.error('Error creating task:', error);
      // If API error, fall back to offline handling
      return handleOfflineOperation({
        type: 'CREATE_TASK',
        data: taskData
      });
    }
  }
  
  // If offline, handle locally
  return handleOfflineOperation({
    type: 'CREATE_TASK',
    data: taskData
  });
};

export const updateTask = async (taskId, taskData, isOnline) => {
  if (isOnline) {
    try {
      const response = await axios.put(`${API_BASE_URL}/tasks/${taskId}`, taskData);
      
      if (response.data.status) {
        // Update cached task
        await OfflineStorage.saveTasks([response.data.task]);
        return response.data;
      }
    } catch (error) {
      console.error('Error updating task:', error);
      return handleOfflineOperation({
        type: 'UPDATE_TASK',
        id: taskId,
        data: taskData
      });
    }
  }
  
  return handleOfflineOperation({
    type: 'UPDATE_TASK',
    id: taskId,
    data: { ...taskData, _id: taskId }
  });
};

export const deleteTask = async (taskId, isOnline) => {
  if (isOnline) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/tasks/${taskId}`);
      
      if (response.data.status) {
        // Remove from local cache
        await OfflineStorage.deleteTask(taskId);
        return response.data;
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      return handleOfflineOperation({
        type: 'DELETE_TASK',
        id: taskId
      });
    }
  }
  
  return handleOfflineOperation({
    type: 'DELETE_TASK',
    id: taskId
  });
};