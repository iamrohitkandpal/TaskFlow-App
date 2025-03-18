import * as BrainJS from 'brain.js';
import * as ss from 'simple-statistics';

/**
 * Service for estimating task effort based on historical data
 * Uses a fallback approach with multiple ML models for robust predictions
 */
class EffortEstimationService {
  constructor() {
    this.brainModel = null;
    this.fallbackModel = null;
    this.featureScaler = null;
    this.targetScaler = null;
  }
  
  /**
   * Trains a model to predict task effort based on historical data
   * Falls back to simpler methods when insufficient data exists
   * @param {Array} tasks - Array of completed tasks with actual effort values
   * @returns {Boolean} Whether training was successful
   */
  async trainModel(tasks) {
    try {
      // Filter out tasks without effort data
      const validTasks = tasks.filter(task => 
        task.actualEffort && task.title && task.description);
      
      if (validTasks.length < 10) {
        console.log('Not enough data to train model, using fallback');
        this.trainFallbackModel(validTasks);
        return false;
      }
      
      try {
        this.trainBrainJSModel(validTasks);
        console.log('BrainJS model trained successfully');
        return true;
      } catch (brainError) {
        console.warn('Failed to train BrainJS model, using fallback:', brainError);
        this.trainFallbackModel(validTasks);
        return false;
      }
    } catch (error) {
      console.error('Error training effort estimation model:', error);
      return false;
    }
  }
  
  /**
   * Trains a BrainJS neural network model for task effort prediction
   * @param {Array} tasks - Array of tasks with effort data
   */
  trainBrainJSModel(tasks) {
    // Create a neural network with appropriate architecture
    const net = new BrainJS.NeuralNetwork({
      hiddenLayers: [10, 5],
      activation: 'sigmoid'
    });
    
    // Prepare training data with normalized input values
    const trainingData = tasks.map(task => {
      // Normalize input values to improve learning efficiency
      const titleLength = task.title.length / 100; // Scale title length
      const descriptionLength = Math.min(task.description?.length || 0, 1000) / 1000;
      const priority = task.priority === 'high' ? 1 : task.priority === 'medium' ? 0.5 : 0;
      const hasDeadline = task.dueDate ? 1 : 0;
      
      // Normalize output values based on maximum effort in dataset
      const maxEffort = Math.max(...tasks.map(t => t.actualEffort));
      const normalizedEffort = task.actualEffort / maxEffort;
      
      return {
        input: {
          titleLength,
          descriptionLength,
          priority,
          hasDeadline
        },
        output: {
          effort: normalizedEffort
        }
      };
    });
    
    // Train the network with appropriate parameters
    net.train(trainingData, {
      iterations: 1000,
      errorThresh: 0.005,
      log: false
    });
    
    this.brainModel = {
      network: net,
      maxEffort: Math.max(...tasks.map(t => t.actualEffort))
    };
  }
  
  /**
   * Creates a simple statistical model as fallback when ML models fail
   * @param {Array} tasks - Array of tasks with effort data
   */
  trainFallbackModel(tasks) {
    // Use simple statistics for fallback predictions
    const efforts = tasks.map(task => task.actualEffort);
    
    this.fallbackModel = {
      mean: ss.mean(efforts) || 8, // Default to 8 hours if no data
      median: ss.median(efforts) || 8,
      byPriority: {
        high: ss.mean(tasks.filter(t => t.priority === 'high').map(t => t.actualEffort)) || 10,
        medium: ss.mean(tasks.filter(t => t.priority === 'medium').map(t => t.actualEffort)) || 8,
        low: ss.mean(tasks.filter(t => t.priority === 'low').map(t => t.actualEffort)) || 6
      }
    };
  }
  
  /**
   * Predicts effort for a new task based on its attributes
   * @param {Object} task - Task object with title, description, priority, etc.
   * @returns {Number} Estimated effort in hours
   */
  async predictEffort(task) {
    try {
      // Try BrainJS model first
      if (this.brainModel) {
        try {
          const titleLength = task.title.length / 100;
          const descriptionLength = Math.min(task.description?.length || 0, 1000) / 1000;
          const priority = task.priority === 'high' ? 1 : task.priority === 'medium' ? 0.5 : 0;
          const hasDeadline = task.dueDate ? 1 : 0;
          
          const result = this.brainModel.network.run({
            titleLength,
            descriptionLength,
            priority,
            hasDeadline
          });
          
          return Math.round(result.effort * this.brainModel.maxEffort * 2) / 2; // Round to nearest 0.5
        } catch (brainError) {
          console.warn('BrainJS prediction failed, using fallback', brainError);
        }
      }
      
      // Use fallback model with priority-based estimation
      if (this.fallbackModel) {
        if (task.priority && this.fallbackModel.byPriority[task.priority]) {
          return this.fallbackModel.byPriority[task.priority];
        }
        return this.fallbackModel.median || this.fallbackModel.mean || 8;
      }
      
      return 8; // Default to 8 hours if all methods fail
    } catch (error) {
      console.error('Error predicting effort:', error);
      return 8; // Default to 8 hours on error
    }
  }
}

// Singleton instance for application-wide use
const effortEstimationService = new EffortEstimationService();
export default effortEstimationService;