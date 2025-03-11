import { summarizeText, localSummarize } from '../services/ai-summarization.service.js';
import { trainEffortEstimationModel, predictTaskEffort } from '../services/effort-estimation.service.js';
import Task from '../models/task.model.js';

// Train the model on application startup
(async () => {
  // Try to train the model, but don't block startup if it fails
  try {
    await trainEffortEstimationModel();
  } catch (error) {
    console.error('Error during initial model training:', error);
  }
})();

// Controller to summarize text
export const summarizeTaskDescription = async (req, res) => {
  try {
    const { text, maxLength = 100, useLocal = true } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        status: false, 
        message: 'Text is required for summarization' 
      });
    }
    
    let summary;
    if (useLocal) {
      // Use local summarization without API calls
      summary = localSummarize(text, Math.ceil(maxLength / 30));
    } else {
      // Use Hugging Face API
      summary = await summarizeText(text, maxLength);
    }
    
    res.status(200).json({
      status: true,
      message: 'Text summarized successfully',
      summary
    });
  } catch (error) {
    console.error('Error in summarizeTaskDescription:', error);
    res.status(500).json({
      status: false,
      message: 'Error summarizing text'
    });
  }
};

// Add this controller function:
export const predictTaskEffortEstimation = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Use existing task if taskId provided
    if (taskId) {
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({
          status: false,
          message: 'Task not found'
        });
      }
      
      const effortDays = await predictTaskEffort(task);
      
      return res.status(200).json({
        status: true,
        effortDays,
        message: 'Task effort estimated successfully'
      });
    } 
    
    // Use task data from request body
    const taskData = req.body;
    if (!taskData) {
      return res.status(400).json({
        status: false,
        message: 'Task data is required for effort estimation'
      });
    }
    
    const effortDays = await predictTaskEffort(taskData);
    
    res.status(200).json({
      status: true,
      effortDays,
      message: 'Task effort estimated successfully'
    });
  } catch (error) {
    console.error('Error in predictTaskEffortEstimation:', error);
    res.status(500).json({
      status: false,
      message: 'Error estimating task effort'
    });
  }
};