import express from "express";
import userRoutes from "./user.routes.js";
import taskRoutes from "./task.routes.js";
import activityRoutes from "./activity.routes.js";
import analyticsRoutes from './analytics.routes.js';
import taskPrioritizationRoutes from './task-prioritization.routes.js';
import aiRoutes from './ai.routes.js';

const router = express.Router();

router.use("/users", userRoutes);
router.use("/tasks", taskRoutes);
router.use("/activities", activityRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/task-prioritization', taskPrioritizationRoutes);
router.use('/ai', aiRoutes);

export default router;