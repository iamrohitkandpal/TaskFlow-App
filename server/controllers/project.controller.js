import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import { calculateCriticalPath } from '../services/critical-path.service.js';

// Add this missing function
export const createProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, members } = req.body;
    const { userId } = req.user;
    
    // Create new project
    const project = new Project({
      name,
      description,
      startDate: startDate || new Date(),
      endDate,
      members: [...new Set([userId, ...(members || [])])], // Ensure unique members with owner included
      owner: userId
    });
    
    await project.save();
    
    res.status(201).json({
      status: true,
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    console.error('Error in createProject:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while creating project'
    });
  }
};

// Get all projects
export const getProjects = async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    // Admin can see all projects, normal users only see their projects
    const query = role === 'Admin' ? {} : { members: userId };
    
    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .sort({ updatedAt: -1 });
    
    res.status(200).json({
      status: true,
      projects
    });
  } catch (error) {
    console.error('Error in getProjects:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while fetching projects'
    });
  }
};

// Get a single project
export const getProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.user;
    
    // Find the project
    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    
    if (!project) {
      return res.status(404).json({
        status: false,
        message: 'Project not found'
      });
    }
    
    // Check if user has access
    if (role !== 'Admin' && !project.members.some(member => member._id.toString() === userId)) {
      return res.status(403).json({
        status: false,
        message: 'You do not have access to this project'
      });
    }
    
    res.status(200).json({
      status: true,
      project
    });
  } catch (error) {
    console.error('Error in getProject:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while fetching project'
    });
  }
};

// Update project
export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.user;
    const updates = req.body;
    
    // Find the project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        status: false,
        message: 'Project not found'
      });
    }
    
    // Check if user has permission to update
    if (role !== 'Admin' && project.owner.toString() !== userId) {
      return res.status(403).json({
        status: false,
        message: 'You do not have permission to update this project'
      });
    }
    
    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'owner') {
        project[key] = updates[key];
      }
    });
    
    await project.save();
    
    res.status(200).json({
      status: true,
      message: 'Project updated successfully',
      project
    });
  } catch (error) {
    console.error('Error in updateProject:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while updating project'
    });
  }
};

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

// Get all tasks for a project
export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.user;
    const { includeDependencies } = req.query;
    
    // Check if user has access to this project
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: userId },
        { members: userId }
      ]
    });
    
    if (!project && role !== 'Admin') {
      return res.status(403).json({
        status: false,
        message: 'You do not have access to this project'
      });
    }
    
    // Find all tasks for this project
    let query = Task.find({ projectId, isTrashed: false });
    
    // If includeDependencies is true, populate the dependencies field
    if (includeDependencies === 'true') {
      query = query.populate('dependencies', 'title stage priority dueDate');
    }
    
    const tasks = await query
      .populate('assignee', 'name email')
      .populate('team', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: true,
      tasks
    });
  } catch (error) {
    console.error('Error in getProjectTasks:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while fetching project tasks'
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

// Add this function alongside your other project controller functions

/**
 * Delete a project and its related data
 */
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.user;
    
    // Find the project first to check ownership
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        status: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is authorized to delete (either project owner or admin)
    if (project.owner.toString() !== userId && role !== 'Admin') {
      return res.status(403).json({
        status: false,
        message: 'You are not authorized to delete this project'
      });
    }
    
    // Delete all tasks associated with this project
    await Task.deleteMany({ projectId });
    
    // Delete the project itself
    await Project.findByIdAndDelete(projectId);
    
    res.status(200).json({
      status: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteProject:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while deleting project'
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