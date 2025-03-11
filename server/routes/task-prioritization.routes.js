import express from 'express';
import { getPrioritizedTasksList, getSuggestedAssignees } from '../controllers/task-prioritization.controller.js';
import { protectedRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route for getting prioritized tasks
router.get('/prioritized-tasks', protectedRoute, getPrioritizedTasksList);

// Route for getting suggested assignees
router.get('/suggested-assignees/:taskId', protectedRoute, getSuggestedAssignees);

export default router;