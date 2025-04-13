import { Server } from "socket.io";
import { setupSocketHandlers } from "./socket.service.js";

/**
 * Initialize Socket.io server with proper configuration
 * @param {Object} httpServer - HTTP server instance
 * @param {Object} corsOptions - CORS configuration
 * @returns {Object} Socket.io instance
 */
export const initializeSocketServer = (httpServer, corsOptions) => {
  const io = new Server(httpServer, { 
    cors: corsOptions,
    // Add proper socket.io settings
    transports: ['websocket', 'polling'],
    pingTimeout: 30000,
    pingInterval: 25000,
    connectTimeout: 10000
  });

  // Socket connection handler
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Set up all socket event handlers
    setupSocketHandlers(io, socket);
  });

  return io;
};