import express from 'express';
import { 
  getAnalyticsData, 
  getAverageCompletionTime, 
  getWorkloadData,
  getStatusDistribution,
  getBurndownData,
  getProductivityData,
  getEnhancedCompletionStats,
  getUserProductivityData,
  getTaskProgressionData
} from '../controllers/analytics.controller.js';
import { protectedRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route to get all analytics data
router.get('/', protectedRoute, getAnalyticsData);

// Routes for individual analytics
router.get('/completion-time', protectedRoute, getAverageCompletionTime);
router.get('/workload', protectedRoute, getWorkloadData);
router.get('/status-distribution', protectedRoute, getStatusDistribution);
router.get('/burndown', protectedRoute, getBurndownData);
router.get('/productivity', protectedRoute, getProductivityData);

// New enhanced analytics routes
router.get('/enhanced-completion', protectedRoute, getEnhancedCompletionStats);
router.get('/user-productivity', protectedRoute, getUserProductivityData);
router.get('/task-progression', protectedRoute, getTaskProgressionData);

export default router;