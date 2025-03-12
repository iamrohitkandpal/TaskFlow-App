import express from 'express';
import {
  saveUserWebhook,
  saveProjectWebhook,
  getUserNotificationSettings,
  getProjectNotificationSettings
} from '../controllers/notification.controller.js';
import { protectedRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/user', protectedRoute, saveUserWebhook);
router.post('/project/:projectId', protectedRoute, saveProjectWebhook);
router.get('/user', protectedRoute, getUserNotificationSettings);
router.get('/project/:projectId', protectedRoute, getProjectNotificationSettings);

export default router;