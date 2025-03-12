import User from '../models/user.model.js';
import Task from '../models/task.model.js';

export const assignTaskBasedOnSkills = async (taskId) => {
  try {
    const task = await Task.findById(taskId);
    
    if (!task) {
      throw new Error('Task not found');
    }
    
    const users = await User.find({
      skills: { $in: task.requiredSkills }
    });
    
    if (users.length === 0) {
      throw new Error('No users found with the required skills');
    }
    
    // Assign the task to the first user found (you can implement more complex logic here)
    task.assignee = users[0]._id;
    await task.save();
    
    return task;
  } catch (error) {
    console.error('Error in assignTaskBasedOnSkills:', error);
    throw error;
  }
};