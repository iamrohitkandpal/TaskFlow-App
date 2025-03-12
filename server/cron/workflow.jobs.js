import cron from 'node-cron';
import { executeRulesForTask } from '../services/automation.service.js';
import Task from '../models/task.model.js';

// Schedule a job to run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled workflow job');
  
  try {
    // Find tasks with approaching deadlines
    const tasks = await Task.find({
      dueDate: { $gte: new Date(), $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    });
    
    // Execute rules for each task
    for (const task of tasks) {
      await executeRulesForTask(task, 'deadlineApproaching');
    }
    
    console.log('Scheduled workflow job completed');
  } catch (error) {
    console.error('Error running scheduled workflow job:', error);
  }
});
