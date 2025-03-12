import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import connectDB from "./utils/connectDB.utils.js";
import { errorHandler, routeNotFound } from "./middlewares/error.middleware.js";
import routes from "./routes/index.js";
import { createServer } from "http";
import { Server } from "socket.io";
import { handleTaskUpdate } from "./services/socket.service.js";
import './cron/workflow.jobs.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }
});

// Socket.io connection handler
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
app.use(cors({
    origin: process.env.CLIENT_URL,
    methods: ["POST", "PUT", "GET", "DELETE"],
    credentials: true,
}));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware for parsing cookies
app.use(cookieParser());

// Logger middleware
app.use(morgan("dev"));

// Placeholder for routes
app.use("/api", routes);

// Placeholder for 404 route handling
app.use(routeNotFound);
// Placeholder for error handling middleware
app.use(errorHandler);

// Start the server and connect to the database
const PORT = process.env.PORT || 7007;

httpServer.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error("Failed to connect to the database:", error.message);
    process.exit(1); // Exit the application if the database connection fails
  }
});
