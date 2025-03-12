import express from "express";
import {
  createSubTask,
  createTask,
  dashBoardStatistics,
  deleteRestoreTask,
  duplicateTask,
  getTask,
  getTasks,
  postTaskActivity,
  trashTask,
  updateTask,
} from "../controllers/task.controller.js";
import { isAdminRoute, protectedRoute } from "../middlewares/auth.middleware.js";
import { checkWipLimit } from '../controllers/user-settings.controller.js';

const router = express.Router();

router.post("/create", protectedRoute, isAdminRoute, createTask);
router.post("/duplicate/:id", protectedRoute, isAdminRoute, duplicateTask);
router.post("/activity/:id", protectedRoute, postTaskActivity);

router.get("/dashboard", protectedRoute, dashBoardStatistics);
router.get("/", protectedRoute, getTasks);
router.get("/:id", protectedRoute, getTask);

router.put("/create-subtask/:id", protectedRoute, isAdminRoute, createSubTask);
router.put("/update/:id", protectedRoute, isAdminRoute, updateTask);
router.put("/:id", protectedRoute, isAdminRoute, trashTask);

router.delete(
  "/delete-restore/:id?",
  protectedRoute,
  isAdminRoute,
  deleteRestoreTask
);

router.post('/', protectedRoute, checkWipLimit, createTask);

// Add this route to your task routes
router.get('/wip-limit/:userId', auth, checkUserWipLimit);

export default router;