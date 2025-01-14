import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import connectDB from "./utils/connectDB.utils.js";
import { errorHandler, routeNotFound } from "./middlewares/error.middleware.js";
import routes from "./routes/index.js";

dotenv.config();

const app = express();

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
app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`Server is running on port ${PORT}`);
  } catch (error) {
    console.error("Failed to connect to the database:", error.message);
    process.exit(1); // Exit the application if the database connection fails
  }
});
