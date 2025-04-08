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
import { standardizeResponse } from './middlewares/response.middleware.js';
import { csrfProtection, attachCsrfToken } from './middlewares/security.middleware.js';
import { apiLimiter, authLimiter } from './middlewares/rate-limit.middleware.js';

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

  // Set up all socket event handlers
  setupSocketHandlers(io, socket);
});

// Export io instance to be used in route handlers
export { io };

// Add the middleware in the correct order - CSRF must be after cookie-parser
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Add security headers middleware
import helmet from 'helmet';

// Apply early in the middleware chain
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
    imgSrc: ["'self'", "data:", "res.cloudinary.com"],
    connectSrc: ["'self'", "wss:", "ws:"]
  }
}));

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// Setup CSRF protection after cookie-parser
app.use(csrfProtection);
app.use(attachCsrfToken);
app.use(standardizeResponse);

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
  res.status(200).json({ 
    status: 'ok', 
    environment: NODE_ENV, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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
