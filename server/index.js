import cors from "cors";
import morgan from "morgan";
import express from "express";
import cookieParser from "cookie-parser";
import connectDB from "./utils/connectDB.utils.js";
import { routeNotFound } from "./middlewares/error.middleware.js";
import routes from "./routes/index.js";
import { createServer } from "http";
import { startCronJobs } from './services/cron.service.js';
import { handleTaskUpdate } from "./services/socket.service.js";
import './cron/workflow.jobs.js';
import { standardizeResponse } from './middlewares/response.middleware.js';
import { csrfProtection, attachCsrfToken } from './middlewares/security.middleware.js';
import { apiLimiter, authLimiter } from './middlewares/rate-limit.middleware.js';
import session from 'express-session';
import crypto from 'crypto';

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
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [config.CLIENT_URL])
      : ['http://localhost:7000', 'http://127.0.0.1:7000', 'http://localhost:3000'];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Request from disallowed origin: ${origin}`);
      callback(null, true); // Still allow it but log it - for development
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
  exposedHeaders: ['Content-Length', 'X-CSRF-Token']
};

// Apply CORS configuration
app.use(cors(corsOptions));

// Import the function
import { initializeSocketServer } from './services/socket-init.service.js';

// Replace the socket.io initialization part with:
const io = initializeSocketServer(httpServer, corsOptions);

// Export io instance to be used in route handlers
export { io };

// Add the middleware in the correct order - CSRF must be after cookie-parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Uncomment or add this line (after cookieParser middleware)
app.use(standardizeResponse);

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

// Make sure the session middleware is configured BEFORE any CSRF middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'taskflow-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Replace existing CSRF middleware with this simpler approach

// Skip CSRF for API routes completely
app.use((req, res, next) => {
  // Only apply CSRF to non-API routes (browser routes)
  if (!req.path.startsWith('/api/')) {
    // Simple CSRF implementation without using session
    const csrfToken = crypto.randomBytes(64).toString('hex');
    res.cookie('csrf-token', csrfToken, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict'
    });
    res.locals.csrfToken = csrfToken;
  }
  next();
});

// Configure logger - use a more concise format in production
if (NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan("dev"));
}

// Import request logger middleware
import { requestLogger } from './middlewares/logger.middleware.js';

// Add this before your routes
app.use(requestLogger);

// Request logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

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

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}\n`, err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production' 
    ? 'Server error' 
    : err.message;
  
  res.status(statusCode).json({
    status: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Add this after your routes
app.use((err, req, res, next) => {
  console.error(`Error processing request: ${req.method} ${req.originalUrl}`);
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    status: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler - keep after all routes
app.use((req, res) => {
  res.status(404).json({
    status: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start the server with improved error handling
const PORT = config.PORT || 7007;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
      
      // Start scheduled jobs in production mode
      if (NODE_ENV === 'production') {
        startCronJobs();
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    // Add retry logic for production
    if (NODE_ENV === 'production') {
      console.log('Retrying server startup in 5 seconds...');
      setTimeout(startServer, 5000);
    } else {
      process.exit(1);
    }
  }
};

startServer();

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
