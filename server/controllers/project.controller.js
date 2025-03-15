import { calculateCriticalPath } from '../services/critical-path.service.js';

// Add this to your project controller
export const getProjectCriticalPath = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.user;
    
    // Check project access
    const project = await Project.findOne({ 
      _id: projectId,
      $or: [
        { owner: userId },
        { members: userId }
      ]
    });
    
    if (!project) {
      return res.status(404).json({
        status: false,
        message: 'Project not found or you do not have access'
      });
    }
    
    // Calculate critical path
    const criticalPath = await calculateCriticalPath(projectId);
    
    // Get tasks on the critical path with details
    const criticalPathTasks = await Task.find({ 
      _id: { $in: criticalPath },
      projectId
    }).select('title startDate dueDate status priority');
    
    res.status(200).json({
      status: true,
      criticalPath: criticalPathTasks
    });
    
  } catch (error) {
    console.error('Error getting project critical path:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while getting critical path'
    });
  }
};