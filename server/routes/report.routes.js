import express from 'express';
import {
  logReport,
  scheduleReport,
  getScheduledReports,
  deleteScheduledReport,
  getReportLogs
} from '../controllers/report.controller.js';
import { checkAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Report routes
router.post('/log', checkAuth, logReport);
router.post('/schedule', checkAuth, scheduleReport);
router.get('/scheduled', checkAuth, getScheduledReports);
router.delete('/scheduled/:reportId', checkAuth, deleteScheduledReport);
router.get('/logs', checkAuth, getReportLogs);

export default router;