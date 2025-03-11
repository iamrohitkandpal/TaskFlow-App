import Task from '../models/task.model.js';
import User from '../models/user.model.js';

/**
 * Calculates priority score for tasks based on various factors
 * - Higher score means higher priority
 */
export const calculateTaskPriority = async (task) => {
  try {
    let priorityScore = 0;
    const now = new Date();

    // 1. Urgency based on deadline
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.max(0, Math.floor((dueDate - now) / (1000 * 60 * 60 * 24)));
      
      if (daysUntilDue === 0) {
        // Due today
        priorityScore += 100; 
      } else if (daysUntilDue <= 3) {
        // Due in next 3 days
        priorityScore += 80;
      } else if (daysUntilDue <= 7) {
        // Due in next week
        priorityScore += 60;
      } else if (daysUntilDue <= 14) {
        // Due in next 2 weeks
        priorityScore += 40;
      } else {
        // Due later
        priorityScore += 20;
      }
    }

    // 2. Priority level explicitly set by user
    if (task.priority) {
      switch (task.priority.toLowerCase()) {
        case 'high':
          priorityScore += 50;
          break;
        case 'medium':
          priorityScore += 30;
          break;
        case 'low':
          priorityScore += 10;
          break;
        default:
          priorityScore += 0;
      }
    }

    // 3. Dependencies factor
    if (task.dependencies && task.dependencies.length > 0) {
      // Check if this task is blocking others
      const blockingTasks = await Task.countDocuments({ 
        dependencies: { $in: [task._id] }
      });
      
      // If this task is blocking others, increase priority
      priorityScore += (blockingTasks * 15);
    }

    return priorityScore;
  } catch (error) {
    console.error('Error calculating task priority:', error);
    return 0;
  }
};

/**
 * Gets all tasks and returns them sorted by priority
 */
export const getPrioritizedTasks = async (userId = null, projectId = null) => {
  try {
    // Build query based on filters
    const query = {};
    
    if (userId) {
      query.assignees = { $in: [userId] };
    }
    
    if (projectId) {
      query.projectId = projectId;
    }
    
    // Only get non-completed tasks
    query.status = { $ne: 'done' };
    
    // Get all applicable tasks
    const tasks = await Task.find(query)
      .populate('assignees', 'name email')
      .populate('createdBy', 'name email');
    
    // Calculate priority for each task
    const tasksWithPriority = await Promise.all(
      tasks.map(async (task) => {
        const priorityScore = await calculateTaskPriority(task);
        // Convert mongoose document to plain object to add priority score
        const taskObj = task.toObject();
        taskObj.priorityScore = priorityScore;
        return taskObj;
      })
    );
    
    // Sort tasks by priority (highest first)
    return tasksWithPriority.sort((a, b) => b.priorityScore - a.priorityScore);
  } catch (error) {
    console.error('Error getting prioritized tasks:', error);
    throw error;
  }
};

/**
 * Assigns tasks to users intelligently based on workload
 */
export const suggestAssignees = async (taskId, requiredSkills = []) => {
  try {
    // Get all users
    const users = await User.find({ isActive: true });
    
    // Get current task assignments for workload analysis
    const assignments = await Task.aggregate([
      { $match: { status: { $ne: 'done' } } },
      { $unwind: '$assignees' },
      { 
        $group: {
          _id: '$assignees',
          taskCount: { $sum: 1 }
        }
      }
    ]);
    
    // Create a map of user IDs to workload
    const userWorkload = {};
    assignments.forEach(item => {
      userWorkload[item._id] = item.taskCount;
    });
    
    // Calculate scores for each user based on workload and skills
    const userScores = users.map(user => {
      let score = 0;
      
      // Workload factor (lower is better)
      const currentWorkload = userWorkload[user._id] || 0;
      score -= (currentWorkload * 10);
      
      // Skills match (if any skills specified)
      if (requiredSkills && requiredSkills.length > 0 && user.skills) {
        const matchingSkills = requiredSkills.filter(skill => 
          user.skills.some(userSkill => 
            userSkill.toLowerCase() === skill.toLowerCase()
          )
        );
        
        // Add score based on matching skills (higher is better)
        score += (matchingSkills.length * 30);
      }
      
      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        score,
        currentWorkload
      };
    });
    
    // Sort by score (highest first)
    return userScores.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error suggesting assignees:', error);
    throw error;
  }
};