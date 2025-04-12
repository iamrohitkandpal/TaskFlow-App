import express from 'express';
import {
  savePushSubscription,
  getVapidPublicKey,
  testPushNotification
} from '../controllers/push-notification.controller.js';
import { protectedRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/subscribe', protectedRoute, savePushSubscription);
router.get('/vapid-public-key', getVapidPublicKey);
router.post('/test', protectedRoute, testPushNotification);

export default router;