import express from "express";
import userRoutes from "./user.routes.js";
import taskRoutes from "./task.routes.js";
import activityRoutes from "./activity.routes.js";
import analyticsRoutes from './analytics.routes.js';
import taskPrioritizationRoutes from './task-prioritization.routes.js';
import aiRoutes from './ai.routes.js';
import integrationRoutes from './integration.routes.js';
import calendarRoutes from './calendar.routes.js';
import notificationRoutes from './notification.routes.js';
import pushNotificationRoutes from './push-notification.routes.js';
import searchRoutes from './search.routes.js';
import reportRoutes from './report.routes.js';
import projectRoutes from './project.routes.js';

const router = express.Router();

// Standardize all routes with consistent paths
router.use("/users", userRoutes);
router.use("/tasks", taskRoutes);
router.use("/activities", activityRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/task-prioritization', taskPrioritizationRoutes);
router.use('/ai', aiRoutes);
router.use('/integrations', integrationRoutes);
router.use('/calendar', calendarRoutes);
router.use('/notifications', notificationRoutes);
router.use('/push-notifications', pushNotificationRoutes);
router.use('/search', searchRoutes);
router.use('/reports', reportRoutes); // Remove /api prefix
router.use('/projects', projectRoutes);

export default router;