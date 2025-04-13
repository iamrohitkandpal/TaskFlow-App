import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/constants";

let socket = null;
const MAX_RECONNECT_ATTEMPTS = 5;
let reconnectAttempts = 0;

const getSocketUrl = () => {
  return SOCKET_URL;
};

export const initializeSocket = (userId) => {
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }

  // Close any existing socket before creating a new one
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  try {
    socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'], // Add polling as fallback
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      timeout: 10000,
      withCredentials: true,
      query: userId ? { userId } : {}
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      reconnectAttempts = 0; // Reset reconnect attempts
      
      if (userId) {
        socket.emit('authenticate', { userId });
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      reconnectAttempts++;
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return socket;
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default socket;