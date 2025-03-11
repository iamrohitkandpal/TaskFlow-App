import express from 'express';
import { summarizeTaskDescription, predictTaskEffortEstimation } from '../controllers/ai.controller.js';
import { protectedRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route to summarize task description
router.post('/summarize', protectedRoute, summarizeTaskDescription);

// Add this route:
router.get('/estimate-effort/:taskId', protectedRoute, predictTaskEffortEstimation);
router.post('/estimate-effort', protectedRoute, predictTaskEffortEstimation);

export default router;