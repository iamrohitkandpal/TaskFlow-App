import express from 'express';
import {
  logReport,
  scheduleReport,
  getScheduledReports,
  deleteScheduledReport,
  getReportLogs
} from '../controllers/report.controller.js';
import { protectedRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Report routes
router.post('/log', protectedRoute, logReport);
router.post('/schedule', protectedRoute, scheduleReport);
router.get('/scheduled', protectedRoute, getScheduledReports);
router.delete('/scheduled/:reportId', protectedRoute, deleteScheduledReport);
router.get('/logs', protectedRoute, getReportLogs);

export default router;