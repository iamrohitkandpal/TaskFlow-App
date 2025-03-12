import express from 'express';
import { checkRole } from '../middlewares/auth.middleware.js';
import {
  getProjectAutomationRules,
  createProjectAutomationRule,
  updateProjectAutomationRule,
  deleteProjectAutomationRule
} from '../controllers/automation.controller.js';

const router = express.Router();

router.get('/:projectId/automation-rules', checkRole(['Admin', 'Manager']), getProjectAutomationRules);
router.post('/:projectId/automation-rules', checkRole(['Admin', 'Manager']), createProjectAutomationRule);
router.put('/:projectId/automation-rules/:ruleId', checkRole(['Admin', 'Manager']), updateProjectAutomationRule);
router.delete('/:projectId/automation-rules/:ruleId', checkRole(['Admin', 'Manager']), deleteProjectAutomationRule);

export default router;