import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  getProject,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectTasks,
  getProjectDependencies,
  getProjectCriticalPath
} from "../controllers/project.controller.js";

const router = express.Router();

// Project routes
router.get('/', protectedRoute, getProjects);
router.get('/:projectId', protectedRoute, getProject);
router.post('/', protectedRoute, createProject);
router.put('/:projectId', protectedRoute, updateProject);
router.delete('/:projectId', protectedRoute, deleteProject);

// Project task routes
router.get('/:projectId/tasks', protectedRoute, getProjectTasks);

// Project dependencies and critical path analysis
router.get('/:projectId/dependencies', protectedRoute, getProjectDependencies);
router.get('/:projectId/critical-path', protectedRoute, getProjectCriticalPath);

export default router;