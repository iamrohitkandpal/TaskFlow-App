import Task from '../models/task.model.js';
import * as ss from 'simple-statistics';

let model = null;
let isModelTrained = false;

/**
 * Train a simple linear regression model for effort estimation
 * @returns {Promise<boolean>} Whether training was successful
 */
export const trainEffortEstimationModel = async () => {
  try {
    // Get completed tasks with actual effort data
    const completedTasks = await Task.find({
      actualEffort: { $exists: true, $ne: null },
      stage: 'completed',
      isTrashed: false
    }).select('priority description team subTasks createdAt activities actualEffort').limit(300);
    
    // Check if we have enough data
    if (completedTasks.length < 10) {
      console.log('Not enough completed tasks to train the model');
      return false;
    }
    
    // Extract features and labels
    const data = completedTasks.map(task => {
      // Convert priority to numeric
      const priorityMap = { high: 3, medium: 2, low: 1, normal: 1 };
      const priority = priorityMap[task.priority?.toLowerCase()] || 1;
      
      // Calculate other features
      const descriptionLength = task.description ? task.description.length : 0;
      const wordCount = task.description ? task.description.split(/\s+/).length : 0;
      const teamSize = task.team?.length || 1;
      const hasSubtasks = task.subTasks?.length > 0 ? 1 : 0;
      
      // Create feature vector
      const features = [priority, wordCount, teamSize, hasSubtasks];
      
      return {
        features,
        effort: task.actualEffort || 1 // Default to 1 day if missing
      };
    });
    
    // Check if we still have enough data after processing
    if (data.length < 10) {
      console.log('Not enough valid data points after processing');
      return false;
    }
    
    // Create simple regression models for each feature
    // We'll use multiple simple models rather than one multivariate model
    model = {
      regressions: [],
      meanEffort: ss.mean(data.map(d => d.effort)),
      medianEffort: ss.median(data.map(d => d.effort))
    };
    
    // Train regression for each feature
    for (let i = 0; i < data[0].features.length; i++) {
      const points = data.map(d => [d.features[i], d.effort]);
      try {
        model.regressions[i] = ss.linearRegression(points);
      } catch (err) {
        console.log(`Could not train regression for feature ${i}`, err);
        model.regressions[i] = null;
      }
    }
    
    isModelTrained = true;
    console.log('Effort estimation model trained successfully');
    return true;
  } catch (error) {
    console.error('Error training effort estimation model:', error);
    return false;
  }
};

/**
 * Predicts the effort required for a task based on its characteristics
 * @param {Object} task - Task object with details
 * @returns {Promise<number>} - Estimated effort in days
 */
export const predictTaskEffort = async (task) => {
  try {
    // Train model if not already trained
    if (!isModelTrained) {
      await trainEffortEstimationModel();
    }
    
    // If model training failed or no model exists, use fallback
    if (!model) {
      return calculateDefaultEstimate(task);
    }
    
    // Extract features from task
    const priorityMap = { high: 3, medium: 2, low: 1, normal: 1 };
    const priority = priorityMap[task.priority?.toLowerCase()] || 1;
    const wordCount = task.description ? task.description.split(/\s+/).length : 0;
    const teamSize = task.team?.length || 1;
    const hasSubtasks = task.subTasks?.length > 0 ? 1 : 0;
    
    const features = [priority, wordCount, teamSize, hasSubtasks];
    
    // Get predictions from each regression model
    const predictions = [];
    for (let i = 0; i < features.length; i++) {
      if (model.regressions[i]) {
        const prediction = model.regressions[i].m * features[i] + model.regressions[i].b;
        predictions.push(prediction);
      }
    }
    
    // Use mean of all predictions if available
    let effort = 0;
    if (predictions.length > 0) {
      effort = ss.mean(predictions);
    } else {
      effort = model.meanEffort; // Fallback to mean effort
    }
    
    // Ensure effort is reasonable (between 1-30 days)
    effort = Math.max(1, Math.min(30, Math.round(effort)));
    
    return effort;
  } catch (error) {
    console.error('Error predicting task effort:', error);
    return calculateDefaultEstimate(task);
  }
};

/**
 * Calculate a default estimate based on simple heuristics
 * @param {Object} task - Task object
 * @returns {number} - Estimated effort in days
 */
const calculateDefaultEstimate = (task) => {
  let baseEffort = 1; // Default minimum effort
  
  // Adjust based on priority
  if (task.priority === 'high') {
    baseEffort += 2;
  } else if (task.priority === 'medium') {
    baseEffort += 1;
  }
  
  // Adjust based on description length
  if (task.description) {
    const wordCount = task.description.split(/\s+/).length;
    if (wordCount > 500) {
      baseEffort += 3;
    } else if (wordCount > 200) {
      baseEffort += 2;
    } else if (wordCount > 50) {
      baseEffort += 1;
    }
  }
  
  // Adjust for subtasks
  if (task.subTasks && task.subTasks.length > 0) {
    baseEffort += Math.min(5, task.subTasks.length);
  }
  
  // Cap at reasonable limits
  return Math.min(15, baseEffort);
};