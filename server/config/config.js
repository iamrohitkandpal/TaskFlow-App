import dotenv from 'dotenv';
dotenv.config();

// Load environment-specific configuration
const NODE_ENV = process.env.NODE_ENV || 'development';

let config;

// Import production config if in production mode
if (NODE_ENV === 'production') {
  const prodConfig = await import('./production.js');
  config = prodConfig.default;
} else {
  // Development configuration
  config = {
    // Server configuration
    NODE_ENV: 'development',
    PORT: process.env.PORT || 7007,
    
    // Database configuration
    MONGODB_URL: process.env.MONGODB_URL || 'mongodb://localhost:27017/taskflow',
    
    // JWT configuration
    JWT_SECRET: process.env.JWT_SECRET || 'development-secret-key',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',
    
    // CORS configuration
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:7000'],
    
    // Email configuration
    EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'smtp',
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT || 587,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM || 'taskflow@example.com',
    EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
    
    // Client URL for redirects
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:7000',
    
    // Logging configuration
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
    
    // Integration configurations
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID,
    GITLAB_CLIENT_SECRET: process.env.GITLAB_CLIENT_SECRET,
  };
}

export default config;