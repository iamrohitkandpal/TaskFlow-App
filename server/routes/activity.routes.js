import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { getTaskActivities, getUserActivities, getRecentActivities } from "../controllers/activity.controller.js";

const router = express.Router();

// Routes
router.get("/", protectedRoute, getRecentActivities);
router.get("/task/:taskId", protectedRoute, getTaskActivities);
router.get("/user/:userId", protectedRoute, getUserActivities);
router.get("/recent", protectedRoute, getRecentActivities);
router.get("/my", protectedRoute, getUserActivities);

export default router;