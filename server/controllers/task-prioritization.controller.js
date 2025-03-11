import { getPrioritizedTasks, suggestAssignees } from '../services/task-prioritization.service.js';

// Get prioritized tasks
export const getPrioritizedTasksList = async (req, res) => {
  try {
    const { userId, projectId } = req.query;
    const prioritizedTasks = await getPrioritizedTasks(userId, projectId);
    
    res.status(200).json({
      status: true,
      message: 'Tasks retrieved and prioritized successfully',
      tasks: prioritizedTasks
    });
  } catch (error) {
    console.error('Error in getPrioritizedTasksList controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Get suggested assignees for a task
export const getSuggestedAssignees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { skills } = req.query;
    
    // Parse skills if provided
    const requiredSkills = skills ? skills.split(',').map(s => s.trim()) : [];
    
    const suggestedUsers = await suggestAssignees(taskId, requiredSkills);
    
    res.status(200).json({
      status: true,
      message: 'Suggested assignees retrieved successfully',
      suggestedAssignees: suggestedUsers
    });
  } catch (error) {
    console.error('Error in getSuggestedAssignees controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error. Please try again later.'
    });
  }
};