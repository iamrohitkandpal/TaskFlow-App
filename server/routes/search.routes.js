import express from 'express';
import {
  searchTasksController,
  saveSearchFilterController,
  getUserSearchFiltersController,
  deleteSearchFilterController
} from '../controllers/search.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Search routes with authentication
router.get('/tasks', authenticateToken, searchTasksController);
router.post('/filters', authenticateToken, saveSearchFilterController);
router.get('/filters', authenticateToken, getUserSearchFiltersController);
router.delete('/filters/:filterId', authenticateToken, deleteSearchFilterController);

export default router;