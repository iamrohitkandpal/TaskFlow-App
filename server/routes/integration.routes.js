import express from 'express';
import {
  connectGitHub,
  connectGitLab,
  getUserIntegrations,
  refreshRepositories,
  linkReference,
  githubWebhook,
  gitlabWebhook
} from '../controllers/integration.controller.js';
import { protectedRoute } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Protected routes
router.post('/connect/github', protectedRoute, connectGitHub);
router.post('/connect/gitlab', protectedRoute, connectGitLab);
router.get('/user', protectedRoute, getUserIntegrations);
router.get('/refresh/:integrationId', protectedRoute, refreshRepositories);
router.post('/link/:taskId', protectedRoute, linkReference);

// Public webhook routes
router.post('/webhook/github/:secret', githubWebhook);
router.post('/webhook/gitlab/:secret', gitlabWebhook);

export default router;