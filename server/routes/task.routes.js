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
  checkUserWipLimit
} from "../controllers/task.controller.js";
import { isAdminRoute, protectedRoute } from "../middlewares/auth.middleware.js";
import { checkWipLimit } from '../controllers/user-settings.controller.js';

const router = express.Router();

router.post("/create", protectedRoute, isAdminRoute, checkWipLimit, createTask);
router.post("/duplicate/:id", protectedRoute, isAdminRoute, duplicateTask);
router.post("/activity/:id", protectedRoute, postTaskActivity);

router.get("/dashboard", protectedRoute, dashBoardStatistics);
router.get("/", protectedRoute, getTasks);
router.get("/:id", protectedRoute, getTask);
router.get('/wip-limit/:userId', protectedRoute, checkUserWipLimit);

router.put("/create-subtask/:id", protectedRoute, isAdminRoute, createSubTask);
router.put("/update/:id", protectedRoute, isAdminRoute, updateTask);
router.put("/trash/:id", protectedRoute, isAdminRoute, trashTask);
router.put("/restore/:id", protectedRoute, isAdminRoute, deleteRestoreTask);

export default router;