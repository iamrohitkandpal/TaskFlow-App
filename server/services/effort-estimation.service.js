import * as tf from '@tensorflow/tfjs-node';
import Task from '../models/task.model.js';

let model = null;
let isModelTrained = false;
let featureNormalizer = null;

/**
 * Preprocess task data for model training
 * @param {Array} tasks - Array of task objects
 * @returns {Object} - Training features and labels
 */
const preprocessData = (tasks) => {
  // Extract features
  const features = tasks.map(task => {
    // Convert priority to numeric
    const priorityMap = { high: 3, medium: 2, low: 1, normal: 1 };
    const priority = priorityMap[task.priority?.toLowerCase()] || 1;
    
    // Get word count from description
    const wordCount = task.description ? task.description.split(/\s+/).length : 0;
    
    // Get assigned team member count
    const teamSize = task.team?.length || 1;
    
    // Check if task has subtasks
    const hasSubtasks = task.subTasks?.length > 0 ? 1 : 0;
    
    // Extract numeric features
    return [priority, wordCount, teamSize, hasSubtasks];
  });
  
  // Convert to tensor
  const X = tf.tensor2d(features);
  
  // Extract completion time in days (label)
  const y = tf.tensor1d(
    tasks.map(task => {
      if (!task.activities || !task.createdAt) return 1; // Default to 1 day
      
      // Find completion activity
      const completionActivity = task.activities.find(a => 
        a.type?.toLowerCase() === 'completed' || a.action?.toLowerCase() === 'completed'
      );
      
      if (!completionActivity || !completionActivity.date) return 1;
      
      // Calculate days between creation and completion
      const creationDate = new Date(task.createdAt);
      const completionDate = new Date(completionActivity.date);
      const days = Math.max(1, Math.ceil((completionDate - creationDate) / (1000 * 60 * 60 * 24)));
      
      return days;
    })
  );
  
  return { X, y };
};

/**
 * Normalize features for better model performance
 */
const normalizeFeatures = (X) => {
  const min = X.min(0);
  const max = X.max(0);
  const range = max.sub(min);
  const normalized = X.sub(min).div(range);
  
  // Save normalizer values for inference
  featureNormalizer = { min, max, range };
  
  return normalized;
};

/**
 * Create and train the effort estimation model
 */
export const trainEffortEstimationModel = async () => {
  try {
    // Skip if already trained
    if (isModelTrained) return;
    
    console.log('Training effort estimation model...');
    
    // Get completed tasks
    const completedTasks = await Task.find({
      'activities': {
        $elemMatch: {
          'type': { $regex: /completed/i }
        }
      }
    }).select('priority description team subTasks createdAt activities').limit(300);
    
    // Check if we have enough data
    if (completedTasks.length < 10) {
      console.log('Not enough completed tasks to train the model');
      return false;
    }
    
    // Process data
    const { X, y } = preprocessData(completedTasks);
    const normalizedX = normalizeFeatures(X);
    
    // Create model
    model = tf.sequential();
    model.add(tf.layers.dense({
      inputShape: [normalizedX.shape[1]],
      units: 8,
      activation: 'relu'
    }));
    model.add(tf.layers.dense({ units: 1 }));
    
    // Compile model
    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError'
    });
    
    // Train model
    await model.fit(normalizedX, y, {
      epochs: 100,
      validationSplit: 0.2,
      verbose: 0
    });
    
    isModelTrained = true;
    console.log('Effort estimation model trained successfully');
    return true;
  } catch (error) {
    console.error('Error training effort estimation model:', error);
    return false;
  }
};

/**
 * Predict effort (in days) for a given task
 * @param {Object} task - Task object
 * @returns {Promise<number>} - Estimated days to complete
 */
export const predictTaskEffort = async (task) => {
  try {
    // Train model if not already trained
    if (!isModelTrained) {
      const success = await trainEffortEstimationModel();
      if (!success) {
        // Return a reasonable default if model training failed
        return calculateDefaultEstimate(task);
      }
    }
    
    // Extract features (same as in training)
    const priorityMap = { high: 3, medium: 2, low: 1, normal: 1 };
    const priority = priorityMap[task.priority?.toLowerCase()] || 1;
    const wordCount = task.description ? task.description.split(/\s+/).length : 0;
    const teamSize = task.team?.length || 1;
    const hasSubtasks = task.subTasks?.length > 0 ? 1 : 0;
    
    // Create feature tensor
    let features = tf.tensor2d([[priority, wordCount, teamSize, hasSubtasks]]);
    
    // Normalize features using saved normalization values
    if (featureNormalizer) {
      features = features.sub(featureNormalizer.min).div(featureNormalizer.range);
    }
    
    // Make prediction
    const prediction = model.predict(features);
    const effortDays = prediction.dataSync()[0];
    
    // Clean up tensors
    features.dispose();
    prediction.dispose();
    
    // Return reasonable value
    return Math.max(1, Math.min(30, Math.round(effortDays)));
  } catch (error) {
    console.error('Error predicting task effort:', error);
    return calculateDefaultEstimate(task);
  }
};

/**
 * Calculate a simple rule-based estimate when ML model is not available
 */
const calculateDefaultEstimate = (task) => {
  // Default estimation based on priority and task features
  const priorityMap = { high: 1, medium: 2, low: 3, normal: 2.5 };
  let baseDays = priorityMap[task.priority?.toLowerCase()] || 2;
  
  // Adjust based on description length
  if (task.description) {
    const words = task.description.split(/\s+/).length;
    baseDays += Math.min(3, words / 200);
  }
  
  // Adjust based on subtasks
  if (task.subTasks?.length) {
    baseDays += task.subTasks.length * 0.5;
  }
  
  return Math.max(1, Math.round(baseDays));
};