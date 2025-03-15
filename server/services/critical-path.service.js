import Task from '../models/task.model.js';

/**
 * Calculates the critical path for a project using the Critical Path Method (CPM)
 * @param {String} projectId - The ID of the project
 * @returns {Array} - An array of task IDs that form the critical path
 */
export const calculateCriticalPath = async (projectId) => {
  try {
    // Get all tasks for the project
    const tasks = await Task.find({ projectId })
      .populate('dependencies')
      .lean();
    
    if (!tasks || tasks.length === 0) {
      return [];
    }
    
    // Build a directed graph from the tasks and their dependencies
    const graph = buildDependencyGraph(tasks);
    
    // Calculate earliest start and finish times
    calculateEarliestTimes(graph);
    
    // Calculate latest start and finish times
    calculateLatestTimes(graph);
    
    // Find tasks with zero slack (critical path)
    const criticalPath = findCriticalPath(graph);
    
    // Update tasks in DB to mark them as on the critical path
    await markCriticalPathTasks(criticalPath);
    
    return criticalPath;
  } catch (error) {
    console.error('Error calculating critical path:', error);
    throw error;
  }
};

/**
 * Builds a dependency graph from tasks
 */
const buildDependencyGraph = (tasks) => {
  const graph = {};
  
  // Initialize all tasks in the graph
  tasks.forEach(task => {
    graph[task._id] = {
      id: task._id,
      title: task.title,
      duration: calculateTaskDuration(task),
      dependencies: task.dependencies?.map(dep => dep._id || dep) || [],
      dependents: [],
      earliestStart: 0,
      earliestFinish: 0,
      latestStart: 0,
      latestFinish: 0,
      slack: 0
    };
  });
  
  // Add dependent information
  Object.values(graph).forEach(task => {
    task.dependencies.forEach(depId => {
      if (graph[depId]) {
        graph[depId].dependents.push(task.id);
      }
    });
  });
  
  return graph;
};

/**
 * Calculate task duration in days
 */
const calculateTaskDuration = (task) => {
  if (task.startDate && task.dueDate) {
    const start = new Date(task.startDate);
    const end = new Date(task.dueDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Minimum 1 day
  }
  return 1; // Default duration
};

/**
 * Calculate earliest start and finish times
 */
const calculateEarliestTimes = (graph) => {
  // Find tasks with no dependencies (starting tasks)
  const startingTasks = Object.values(graph).filter(task => task.dependencies.length === 0);
  
  // Process tasks in topological order
  const processQueue = [...startingTasks];
  while (processQueue.length > 0) {
    const task = processQueue.shift();
    
    // Calculate earliest finish time
    task.earliestFinish = task.earliestStart + task.duration;
    
    // Update dependent tasks
    task.dependents.forEach(depId => {
      const dependent = graph[depId];
      
      // Update earliest start time of dependent if needed
      const newEarliestStart = task.earliestFinish;
      if (newEarliestStart > dependent.earliestStart) {
        dependent.earliestStart = newEarliestStart;
      }
      
      // Check if all dependencies have been processed
      const allDependenciesProcessed = dependent.dependencies.every(
        id => graph[id].earliestFinish > 0
      );
      
      // Add to process queue if not already processed and all dependencies are done
      if (allDependenciesProcessed && dependent.earliestFinish === 0) {
        processQueue.push(dependent);
      }
    });
  }
};

/**
 * Calculate latest start and finish times
 */
const calculateLatestTimes = (graph) => {
  // Find tasks with no dependents (ending tasks)
  const endingTasks = Object.values(graph).filter(task => task.dependents.length === 0);
  
  // Set latest finish time for ending tasks to their earliest finish time
  const maxEarliestFinish = Math.max(...endingTasks.map(task => task.earliestFinish));
  endingTasks.forEach(task => {
    task.latestFinish = maxEarliestFinish;
  });
  
  // Process tasks in reverse topological order
  const processQueue = [...endingTasks];
  while (processQueue.length > 0) {
    const task = processQueue.shift();
    
    // Calculate latest start time
    task.latestStart = task.latestFinish - task.duration;
    
    // Calculate slack
    task.slack = task.latestStart - task.earliestStart;
    
    // Update dependencies
    task.dependencies.forEach(depId => {
      const dependency = graph[depId];
      
      // Update latest finish time if needed
      if (dependency.latestFinish === 0 || task.latestStart < dependency.latestFinish) {
        dependency.latestFinish = task.latestStart;
      }
      
      // Check if all dependents have been processed
      const allDependentsProcessed = dependency.dependents.every(
        id => graph[id].latestStart > 0
      );
      
      // Add to process queue if not already processed and all dependents are done
      if (allDependentsProcessed && dependency.latestStart === 0) {
        processQueue.push(dependency);
      }
    });
  }
};

/**
 * Find tasks with zero slack (critical path)
 */
const findCriticalPath = (graph) => {
  return Object.values(graph)
    .filter(task => task.slack === 0)
    .map(task => task.id);
};

/**
 * Mark tasks as on critical path in the database
 */
const markCriticalPathTasks = async (criticalPath) => {
  if (criticalPath.length === 0) return;
  
  // Mark tasks on the critical path
  await Task.updateMany(
    { _id: { $in: criticalPath } },
    { $set: { isOnCriticalPath: true } }
  );
  
  // Unmark tasks not on the critical path
  await Task.updateMany(
    { _id: { $nin: criticalPath } },
    { $set: { isOnCriticalPath: false } }
  );
};