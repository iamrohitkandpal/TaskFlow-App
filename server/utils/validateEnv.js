import { cleanEnv, str, port, url } from 'envalid';

export default function validateEnv() {
  return cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'production', 'test'] }),
    PORT: port({ default: 7007 }),
    MONGODB_URL: str(), // Changed from MONGO_URI to match actual variable name used
    JWT_SECRET: str(),
    CLIENT_URL: url(),
    CLOUDINARY_CLOUD_NAME: str(),
    CLOUDINARY_API_KEY: str(),
    CLOUDINARY_API_SECRET: str(),
  });
}

// Add to index.js
import validateEnv from './utils/validateEnv.js';
const env = validateEnv();