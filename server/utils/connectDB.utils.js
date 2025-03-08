import mongoose from "mongoose";
import jwt from 'jsonwebtoken';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
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

