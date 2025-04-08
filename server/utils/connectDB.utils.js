import mongoose from "mongoose";
import jwt from 'jsonwebtoken';

// Add reconnection logic to database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      // Add these for better reconnection handling
      autoIndex: true,
      retryWrites: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Add connection event handlers
    mongoose.connection.on('error', err => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected, attempting to reconnect...');
    });
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // Retry connection after delay instead of exiting in production
    if (process.env.NODE_ENV === 'production') {
      console.log('Retrying connection in 5 seconds...');
      setTimeout(connectDB, 5000);
    } else {
      process.exit(1);
    }
  }
};

export default connectDB;

export const createJWT = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Attach the token to cookies
  res.cookie("token", token, {
    httpOnly: true, // Prevents JavaScript access to cookies for security
    secure: process.env.NODE_ENV === "production", // Ensures HTTPS in production
    sameSite: "Strict", // Prevents CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

