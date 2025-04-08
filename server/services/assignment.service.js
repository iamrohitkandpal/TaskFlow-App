import Task from '../models/task.model.js';
import User from '../models/user.model.js';
import { logActivity } from './activity.service.js';

/**
 * Assign task to users based on skill matching
 * @param {String} taskId - ID of the task to assign
 */
export const assignTaskBasedOnSkills = async (taskId) => {
  try {
    // Get the task
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error(`Task not found with ID: ${taskId}`);
    }
    
    // If task already has assignees, don't reassign
    if (task.team && task.team.length > 0) {
      return;
    }
    
    // Extract skills from task title and description
    const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
    
    // Find keywords in task text
    const skillKeywords = [
      'frontend', 'backend', 'fullstack', 'design', 'testing',
      'react', 'node', 'javascript', 'python', 'java', 'database',
      'api', 'ui', 'ux', 'devops', 'mobile', 'security'
    ];
    
    const detectedSkills = skillKeywords.filter(skill => 
      taskText.includes(skill)
    );
    
    // Find users with matching skills
    let potentialAssignees = [];
    
    if (detectedSkills.length > 0) {
      // Find users with matching skills in their profile
      potentialAssignees = await User.find({
        isActive: true,
        skills: { $in: detectedSkills }
      }).limit(3);
    }
    
    // If no skill-matched users found, get users with fewest active tasks
    if (potentialAssignees.length === 0) {
      const users = await User.find({ isActive: true }).select('_id');
      
      // Count active tasks for each user
      const userTaskCounts = await Promise.all(
        users.map(async (user) => {
          const count = await Task.countDocuments({
            team: user._id,
            stage: { $ne: 'completed' },
            isTrashed: false
          });
          
          return { userId: user._id, taskCount: count };
        })
      );
      
      // Sort by task count (ascending)
      userTaskCounts.sort((a, b) => a.taskCount - b.taskCount);
      
      // Get the top 2 users with fewest tasks
      const userIds = userTaskCounts
        .slice(0, 2)
        .map(item => item.userId);
      
      potentialAssignees = await User.find({
        _id: { $in: userIds }
      });
    }
    
    // Assign the task
    if (potentialAssignees.length > 0) {
      // Assign to user with relevant skills or lowest workload
      task.team = [potentialAssignees[0]._id];
      
      // Also set the assignee field if it exists
      if ('assignee' in task) {
        task.assignee = potentialAssignees[0]._id;
      }
      
      await task.save();
      
      // Log the activity
      await logActivity(
        potentialAssignees[0]._id,
        task._id,
        'assigned',
        `Task was automatically assigned to ${potentialAssignees[0].name} based on skills/workload`
      );
    }
    
    return task;
  } catch (error) {
    console.error('Error in assignTaskBasedOnSkills:', error);
    throw error;
  }
};