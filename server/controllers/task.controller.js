import User from "../models/user.model.js";
import Task from "../models/task.model.js";
import Notice from "../models/notification.model.js";
import { io } from "../index.js";
import { assignTaskBasedOnSkills } from '../services/assignment.service.js';
import { asyncHandler, ensureUserId, safeQuery, validateId } from '../utils/controllerUtils.js';

export const createTask = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const taskData = req.body;
  
  // Validate required fields
  if (!taskData.title) {
    const error = new Error('Task title is required');
    error.statusCode = 400;
    throw error;
  }
  
  const newTask = await safeQuery(
    () => new Task(taskData).save(),
    'Failed to create task'
  );
  
  // Emit socket event for real-time updates
  io.emit("taskCreated", {
    task: newTask,
    userId
  });
  
  res.status(201).json({
    status: true,
    message: 'Task created successfully',
    task: newTask
  });
});

export const duplicateTask = asyncHandler(async (req, res) => {
  const userId = ensureUserId(req);
  const { id } = req.params;
  
  validateId(id, 'task');
  
  const task = await safeQuery(
    () => Task.findById(id),
    `Failed to find task with ID ${id}`
  );
  
  if (!task) {
    const error = new Error('Task not found');
    error.statusCode = 404;
    throw error;
  }
  
  // Create a duplicate with new task data
  const duplicateData = { ...task.toObject() };
  delete duplicateData._id;
  duplicateData.title = `Copy of ${task.title}`;
  
  const newTask = await safeQuery(
    () => new Task(duplicateData).save(),
    'Failed to duplicate task'
  );
  
  // Create activity for the duplication
  await safeQuery(
    () => new Activity({
      user: userId,
      action: "DUPLICATE_TASK",
      taskId: newTask._id,
      task: task._id,
    }).save(),
    'Failed to record task duplication activity'
  );
  
  res.status(200).json({ 
    status: true, 
    message: "Task duplicated successfully." 
  });
});

export const postTaskActivity = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const { type, activity } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    task.activities.push({ type, activity, by: userId });
    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Activity posted successfully." });
  } catch (error) {
    console.error("Error in postTaskActivity:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const dashBoardStatistics = asyncHandler(async (req, res) => {
  try {
    const { userId, isAdmin } = req.user || {};
    
    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required"
      });
    }

    // Add more specific error handling
    let allTasks = [];
    let users = [];

    // Define query based on user role
    const query = isAdmin 
      ? { isTrashed: false }
      : { isTrashed: false, team: userId };
    
    try {
      allTasks = await Task.find(query)
        .populate({
          path: "team",
          select: "name role title email",
        })
        .sort({ _id: -1 })
        .lean();
    } catch (taskError) {
      console.error("Task query error:", taskError);
      // Continue with empty tasks instead of failing completely
    }
    
    try {
      users = await User.find({ isActive: true })
        .select("name title role isAdmin")
        .limit(10)
        .sort({ _id: -1 })
        .lean();
    } catch (userError) {
      console.error("User query error:", userError);
      // Continue with empty users instead of failing completely
    }
    
    // Process task statistics safely
    const groupTasks = allTasks.reduce((result, task) => {
      const stage = task.stage || "backlog";
      result[stage] = (result[stage] || 0) + 1;
      return result;
    }, {});
    
    res.status(200).json({
      status: true,
      statistics: groupTasks,
      users,
      tasks: allTasks
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error);
    res.status(500).json({
      status: false,
      message: "Server error while fetching dashboard data"
    });
  }
});

export const getTasks = async (req, res) => {
  try {
    const { stage, isTrashed } = req.query;
    const { userId, isAdmin } = req.user;

    const query = isAdmin
      ? { isTrashed: isTrashed === "true" }
      : { isTrashed: isTrashed === "true", team: { $all: [userId] } };
    if (stage) query.stage = stage;

    const tasks = isAdmin
      ? await Task.find(query)
          .populate({
            path: "team",
            select: "name title email",
          })
          .sort({ _id: -1 })
      : await Task.find(query)
          .populate({
            path: "team",
            select: "name title email",
          })
          .sort({ _id: -1 });

    res.status(200).json({ status: true, tasks });
  } catch (error) {
    console.error("Error in getTasks:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate({
        path: "team",
        select: "name title role email",
      })
      .populate({
        path: "activities.by",
        select: "name",
      });

    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    res.status(200).json({ status: true, task });
  } catch (error) {
    console.error("Error in getTask:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const createSubTask = async (req, res) => {
  try {
    const { title, tag, date } = req.body;
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    task.subTasks.push({ title, date, tag });
    await task.save();

    res
      .status(200)
      .json({ status: true, message: "SubTask added successfully." });
  } catch (error) {
    console.error("Error in createSubTask:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, team, stage, priority, assets } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    Object.assign(task, {
      title,
      date,
      team,
      stage: stage?.toLowerCase(),
      priority: priority?.toLowerCase(),
      assets,
    });

    await task.save();

    // Emit socket event
    io.emit("taskUpdated", { 
      action: "update", 
      task: task,
      userId: req.user.userId
    });

    res
      .status(200)
      .json({ status: true, message: "Task updated successfully." });
  } catch (error) {
    console.error("Error in updateTask:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const trashTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    task.isTrashed = true;
    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Task trashed successfully." });
  } catch (error) {
    console.error("Error in trashTask:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};

export const deleteRestoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType } = req.query;

    // For single task operations, verify the task exists first
    if ((actionType === "delete" || actionType === "restore") && id !== "all") {
      const taskExists = await Task.exists({ _id: id });
      if (!taskExists) {
        return res.status(404).json({ 
          status: false, 
          message: "Task not found" 
        });
      }
    }

    if (actionType === "delete") {
      await Task.findByIdAndDelete(id);
    } else if (actionType === "deleteAll") {
      await Task.deleteMany({ isTrashed: true });
    } else if (actionType === "restore") {
      const task = await Task.findById(id);
      if (task) {
        task.isTrashed = false;
        await task.save();
      }
    } else if (actionType === "restoreAll") {
      await Task.updateMany(
        { isTrashed: true },
        { $set: { isTrashed: false } }
      );
    } else {
      return res.status(400).json({ 
        status: false, 
        message: "Invalid action type" 
      });
    }

    // Emit socket event
    io.emit("taskUpdated", { 
      action: actionType, 
      taskId: id,
      userId: req.user.userId
    });

    res.status(200).json({ 
      status: true, 
      message: "Operation performed successfully." 
    });
  } catch (error) {
    console.error("Error in deleteRestoreTask:", error.message);
    // Check for invalid ObjectId format
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res.status(400).json({ 
        status: false, 
        message: "Invalid task ID format" 
      });
    }
    return res.status(500).json({ 
      status: false, 
      message: "Server Error" 
    });
  }
};

export const checkUserWipLimit = async (req, res) => {
  try {
    const { userId } = req.params;
    const { maxTasksInProgress = 3 } = req.query;
    
    // Count tasks currently in progress for the user
    const tasksInProgressCount = await Task.countDocuments({
      assignee: userId,
      stage: 'in-progress',
      isTrashed: false
    });
    
    const isLimitExceeded = tasksInProgressCount >= Number(maxTasksInProgress);
    
    res.status(200).json({
      status: true,
      isLimitExceeded,
      currentCount: tasksInProgressCount,
      limit: Number(maxTasksInProgress)
    });
  } catch (error) {
    console.error("Error in checkUserWipLimit:", error.message);
    return res.status(500).json({ status: false, message: "Server Error" });
  }
};
