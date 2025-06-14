import io from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';

let socket = null;

export const initializeSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['polling', 'websocket'], // Change order to try polling first
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: false // Change to false for manual connection
    });

    // Add connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    socket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error.message);
      // Fallback to polling if websocket fails
      if (socket.io.opts.transports[0] === 'websocket') {
        socket.io.opts.transports = ['polling', 'websocket'];
      }
    });

    // Manually connect after configuration
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default socket;