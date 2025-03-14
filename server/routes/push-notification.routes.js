import express from 'express';
import {
  savePushSubscription,
  getVapidPublicKey,
  testPushNotification
} from '../controllers/push-notification.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/subscribe', authenticateToken, savePushSubscription);
router.get('/vapid-public-key', getVapidPublicKey);
router.post('/test', authenticateToken, testPushNotification);

export default router;