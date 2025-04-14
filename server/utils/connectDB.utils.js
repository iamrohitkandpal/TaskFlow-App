import mongoose from "mongoose";
import jwt from 'jsonwebtoken';

const connectDB = async () => {
  try {
    // Add reconnect options and better error handling
    const mongoURI = process.env.MONGODB_URL;
    
    if (!mongoURI) {
      console.error('MongoDB connection string missing! Check your .env file');
      process.exit(1);
    }
    
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 10000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Add reconnection handling
    mongoose.connection.on('error', err => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected, attempting to reconnect...');
    });
    
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    // Don't exit the process, instead return the error
    throw error;
  }
};

export const createJWT = (res, userId) => {
  // Your JWT creation code is likely fine
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict", 
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export default connectDB;

