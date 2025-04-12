import store from '../redux/store';  // Correct - using default import
import { addTask, updateTask, deleteTask } from '../redux/slices/taskSlice';
import { addActivity } from '../redux/slices/activitySlice';
import { API_BASE_URL } from '../config/constants';

import io from 'socket.io-client';

// Create socket connection, replacing the http:// or https:// with ws:// or wss://
const socketUrl = API_BASE_URL.replace(/^http/, 'ws').replace('/api', '');
let socket = null;

export const initializeSocket = (userId) => {
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }

  socket = io(socketUrl, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Setup connection event listeners
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    
    // Join user's personal room for targeted updates
    if (userId) {
      socket.emit('join', userId);
    }
  });

  socket.on('taskUpdate', (data) => {
    if (data.action === 'create') {
      store.dispatch(addTask(data.task));
    } else if (data.action === 'update') {
      store.dispatch(updateTask(data.task));
    } else if (data.action === 'delete') {
      store.dispatch(deleteTask(data.taskId));
    }
  });

  socket.on('newActivity', (activity) => {
    store.dispatch(addActivity(activity));
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default socket;