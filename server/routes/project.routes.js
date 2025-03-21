import express from 'express';
import { checkRole } from '../middlewares/auth.middleware.js';
import { checkAuth } from '../middlewares/auth.middleware.js';
import {
  getProjectAutomationRules,
  createProjectAutomationRule,
  updateProjectAutomationRule,
  deleteProjectAutomationRule,
  getProjectDependencies,
  getProjectCriticalPath
} from '../controllers/automation.controller.js';

const router = express.Router();

router.get('/:projectId/automation-rules', checkRole(['Admin', 'Manager']), getProjectAutomationRules);
router.post('/:projectId/automation-rules', checkRole(['Admin', 'Manager']), createProjectAutomationRule);
router.put('/:projectId/automation-rules/:ruleId', checkRole(['Admin', 'Manager']), updateProjectAutomationRule);
router.delete('/:projectId/automation-rules/:ruleId', checkRole(['Admin', 'Manager']), deleteProjectAutomationRule);

// Add these routes to your project routes
router.get('/:projectId/dependencies', checkAuth, getProjectDependencies);
router.get('/:projectId/critical-path', checkAuth, getProjectCriticalPath);

export default router;