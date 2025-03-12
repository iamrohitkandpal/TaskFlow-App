import express from 'express';
import {
  connectCalDAV,
  syncTaskToCalendar,
  getUserCalendars
} from '../controllers/calendar.controller.js';
import { protectedRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/caldav/connect', protectedRoute, connectCalDAV);
router.post('/task/sync', protectedRoute, syncTaskToCalendar);
router.get('/user', protectedRoute, getUserCalendars);

export default router;