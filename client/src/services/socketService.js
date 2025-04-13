import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/constants";

let socket;

export const initializeSocket = (userId) => {
  if (socket) {
    // Already initialized
    return socket;
  }
  
  // Create socket with reconnection options
  socket = io(SOCKET_URL, {
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    auth: { userId },
    withCredentials: true
  });
  
  // Setup handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    if (userId) {
      socket.emit('join', userId);
    }
  });
  
  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });
  
  socket.on('reconnect', (attempt) => {
    console.log(`Socket reconnected after ${attempt} attempts`);
    if (userId) {
      socket.emit('join', userId);
    }
  });
  
  socket.on('reconnect_error', (err) => {
    console.error('Socket reconnection error:', err.message);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log(`Socket reconnection attempt: ${attemptNumber}`);
  });

  socket.on('reconnect_failed', () => {
    console.error('Socket reconnection failed after all attempts');
    // Show error to user
    toast.error('Lost connection to server. Please refresh the page.');
  });

  socket.io.on('error', (error) => {
    console.error('Socket transport error:', error);
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