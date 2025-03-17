import { calculateCriticalPath } from '../services/critical-path.service.js';

// Add these methods to your project controller

// Get all dependencies for a project
export const getProjectDependencies = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.user;
    
    // Check if user has access to this project
    const project = await Project.findOne({
      _id: projectId,
      members: userId
    });
    
    if (!project) {
      return res.status(403).json({
        status: false,
        message: 'You do not have access to this project'
      });
    }
    
    // Find all tasks for this project that have dependencies
    const tasks = await Task.find({ 
      projectId,
      dependencies: { $exists: true, $ne: [] }
    });
    
    // Extract dependencies
    const dependencies = [];
    tasks.forEach(task => {
      if (task.dependencies && task.dependencies.length) {
        task.dependencies.forEach(depId => {
          dependencies.push({
            taskId: task._id,
            dependsOn: depId
          });
        });
      }
    });
    
    res.status(200).json({
      status: true,
      dependencies
    });
  } catch (error) {
    console.error('Error in getProjectDependencies:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while fetching dependencies'
    });
  }
};

// Calculate and return the critical path
export const getProjectCriticalPath = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.user;
    
    // Check if user has access to this project
    const project = await Project.findOne({
      _id: projectId,
      members: userId
    });
    
    if (!project) {
      return res.status(403).json({
        status: false,
        message: 'You do not have access to this project'
      });
    }
    
    // Find all tasks for this project
    const tasks = await Task.find({ projectId })
      .populate('dependencies')
      .populate('assignee', 'name');
    
    // Build a graph of task dependencies
    const taskMap = new Map();
    tasks.forEach(task => {
      taskMap.set(task._id.toString(), {
        _id: task._id,
        title: task.title,
        duration: calculateTaskDuration(task),
        dueDate: task.dueDate,
        assignee: task.assignee,
        dependencies: task.dependencies?.map(dep => dep._id.toString()) || [],
        dependents: [],
        risk: assessTaskRisk(task),
        earliestStart: 0,
        earliestFinish: 0,
        latestStart: 0,
        latestFinish: 0,
        slack: 0,
        isOnCriticalPath: false
      });
    });
    
    // Build reverse dependencies (dependents)
    for (const [id, task] of taskMap.entries()) {
      task.dependencies.forEach(depId => {
        const depTask = taskMap.get(depId);
        if (depTask) {
          depTask.dependents.push(id);
        }
      });
    }
    
    // Find start tasks (no dependencies)
    const startTasks = Array.from(taskMap.values()).filter(task => task.dependencies.length === 0);
    
    // Calculate earliest start and finish times
    calculateForward(startTasks, taskMap);
    
    // Find end tasks (no dependents)
    const endTasks = Array.from(taskMap.values()).filter(task => task.dependents.length === 0);
    
    // Set latest finish time for end tasks to their earliest finish time
    endTasks.forEach(task => {
      task.latestFinish = task.earliestFinish;
      task.latestStart = task.latestFinish - task.duration;
    });
    
    // Calculate latest start and finish times (backward pass)
    calculateBackward(endTasks, taskMap);
    
    // Calculate slack and identify critical path
    for (const task of taskMap.values()) {
      task.slack = task.latestStart - task.earliestStart;
      task.isOnCriticalPath = task.slack === 0;
    }
    
    // Extract the critical path
    const criticalPath = Array.from(taskMap.values())
      .filter(task => task.isOnCriticalPath)
      .sort((a, b) => a.earliestStart - b.earliestStart);
    
    res.status(200).json({
      status: true,
      criticalPath
    });
  } catch (error) {
    console.error('Error in getProjectCriticalPath:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while calculating critical path'
    });
  }
};

// Helper function to calculate task duration in days
const calculateTaskDuration = (task) => {
  if (task.startDate && task.dueDate) {
    const start = new Date(task.startDate);
    const end = new Date(task.dueDate);
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  }
  return task.estimatedEffort || 1; // Default to estimated effort or 1 day
};

// Helper function to assess task risk level
const assessTaskRisk = (task) => {
  if (!task.startDate || !task.dueDate) return 'high';
  if (task.priority === 'high') return 'high';
  if (task.dependencies && task.dependencies.length > 2) return 'high';
  if (task.priority === 'medium') return 'medium';
  return 'low';
};

// Forward pass to calculate earliest start and finish times
const calculateForward = (tasks, taskMap) => {
  const queue = [...tasks];
  
  while (queue.length > 0) {
    const task = queue.shift();
    
    // Calculate earliest finish time
    task.earliestFinish = task.earliestStart + task.duration;
    
    // Update dependent tasks
    task.dependents.forEach(depId => {
      const depTask = taskMap.get(depId);
      if (depTask) {
        depTask.earliestStart = Math.max(depTask.earliestStart, task.earliestFinish);
        
        // Check if all dependencies have been processed
        const allDepsProcessed = depTask.dependencies.every(id => {
          const dep = taskMap.get(id);
          return dep && dep.earliestFinish > 0;
        });
        
        if (allDepsProcessed && !queue.includes(depTask)) {
          queue.push(depTask);
        }
      }
    });
  }
};

// Backward pass to calculate latest start and finish times
const calculateBackward = (tasks, taskMap) => {
  const queue = [...tasks];
  const processed = new Set();
  
  while (queue.length > 0) {
    const task = queue.shift();
    processed.add(task._id.toString());
    
    // Calculate latest start time
    task.latestStart = task.latestFinish - task.duration;
    
    // Update dependency tasks
    task.dependencies.forEach(depId => {
      const depTask = taskMap.get(depId);
      if (depTask) {
        // Latest finish is the minimum of all dependent tasks' latest starts
        if (depTask.latestFinish === 0 || task.latestStart < depTask.latestFinish) {
          depTask.latestFinish = task.latestStart;
        }
        
        // Check if all dependents have been processed
        const allDependentsProcessed = depTask.dependents.every(id => 
          processed.has(id)
        );
        
        if (allDependentsProcessed && !queue.includes(depTask)) {
          queue.push(depTask);
        }
      }
    });
  }
};