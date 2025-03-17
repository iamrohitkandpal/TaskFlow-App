import cors from "cors";
import morgan from "morgan";
import express from "express";
import cookieParser from "cookie-parser";
import connectDB from "./utils/connectDB.utils.js";
import { errorHandler, routeNotFound } from "./middlewares/error.middleware.js";
import routes from "./routes/index.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { startCronJobs } from './services/cron.service.js';
import { handleTaskUpdate } from "./services/socket.service.js";
import './cron/workflow.jobs.js';

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Import appropriate config based on environment
const NODE_ENV = process.env.NODE_ENV || 'development';
let config;

if (NODE_ENV === 'production') {
  // Dynamic import for production config
  const prodConfig = await import('./config/production.js');
  config = prodConfig.default;
} else {
  // Use environment variables directly for development
  config = {
    PORT: process.env.PORT || 7007,
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:7000',
    // Add other config values as needed
  };
}

const app = express();
const httpServer = createServer(app);

// Configure CORS
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? config.ALLOWED_ORIGINS 
    : config.CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

// Socket.io setup with proper CORS for production
const io = new Server(httpServer, { cors: corsOptions });

// Socket connection handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room based on user ID for targeted updates
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });
  
  // Join project rooms for project-specific updates
  socket.on("joinProject", (projectId) => {
    socket.join(`project-${projectId}`);
    console.log(`Socket ${socket.id} joined project room: project-${projectId}`);
  });

  // Handle task updates with enhanced functionality
  socket.on("taskUpdate", (data) => {
    handleTaskUpdate(socket, data);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Export io instance to be used in route handlers
export { io };

// Middleware for CORS
app.use(cors(corsOptions));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware for parsing cookies
app.use(cookieParser());

// Configure logger - use a more concise format in production
if (NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan("dev"));
}

// API routes
app.use("/api", routes);

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: NODE_ENV });
});

// Error handling
app.use(routeNotFound);
app.use(errorHandler);

// Start the server
const PORT = config.PORT || 7007;

httpServer.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
    
    // Start scheduled jobs in production mode
    if (NODE_ENV === 'production') {
      startCronJobs();
    }
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
});

// Handle graceful shutdown
const handleShutdown = () => {
  console.log('Shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10s if server doesn't close gracefully
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);
