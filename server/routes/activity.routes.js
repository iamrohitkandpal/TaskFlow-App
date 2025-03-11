import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { getActivities, getTaskActivities, getUserActivities, getRecentActivities } from "../controllers/activity.controller.js";

const router = express.Router();

router.get("/", protectedRoute, getActivities);
router.get("/task/:taskId", protectedRoute, getTaskActivities);
router.get("/user/:userId", protectedRoute, getUserActivities);

// Get recent activities (protected)
router.get("/recent", protectedRoute, getRecentActivities);

// Get user's activities (protected)
router.get("/my", protectedRoute, getUserActivities);

export default router;