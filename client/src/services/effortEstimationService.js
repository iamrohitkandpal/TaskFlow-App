import * as ss from 'simple-statistics';

/**
 * Service for estimating task effort based on historical data
 * Uses a statistical approach for robust predictions
 */
class EffortEstimationService {
  constructor() {
    this.regressionModel = null;
    this.fallbackModel = null;
    this.featureWeights = null;
    this.maxEffort = 0;
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
        this.trainRegressionModel(validTasks);
        console.log('Regression model trained successfully');
        return true;
      } catch (regressionError) {
        console.warn('Failed to train regression model, using fallback');
        this.trainFallbackModel(validTasks);
        return false;
      }
    } catch (error) {
      console.error('Error training effort estimation model:', error);
      return false;
    }
  }
  
  trainRegressionModel(tasks) {
    // Implementation without brain.js - using simple linear regression instead
    // Prepare data for training
    const features = [];
    const efforts = [];
    this.maxEffort = Math.max(...tasks.map(t => t.actualEffort));
    
    // Extract features and target values
    tasks.forEach(task => {
      const titleLength = task.title.length / 100;
      const descriptionLength = Math.min(task.description?.length || 0, 1000) / 1000;
      const priority = task.priority === 'high' ? 1 : task.priority === 'medium' ? 0.5 : 0;
      const hasDeadline = task.dueDate ? 1 : 0;
      
      features.push([titleLength, descriptionLength, priority, hasDeadline]);
      efforts.push(task.actualEffort / this.maxEffort); // Normalize effort
    });
    
    // Train individual regression models for each feature
    this.featureWeights = [];
    
    for (let i = 0; i < 4; i++) {
      const featureValues = features.map(f => f[i]);
      
      try {
        // Create a simple linear regression for each feature
        const regression = ss.linearRegression(
          featureValues.map((val, idx) => [val, efforts[idx]])
        );
        this.featureWeights.push(regression);
      } catch (err) {
        // If regression fails for a feature, use a default weight
        this.featureWeights.push({ m: 0.1, b: 0.2 });
      }
    }
    
    this.regressionModel = true;
  }
  
  trainFallbackModel(tasks) {
    // Create a simple statistical model when regression doesn't work
    const efforts = tasks.map(task => task.actualEffort);
    
    this.fallbackModel = {
      mean: ss.mean(efforts) || 8,
      median: ss.median(efforts) || 8,
      byPriority: {
        high: ss.mean(tasks.filter(t => t.priority === 'high').map(t => t.actualEffort)) || 10,
        medium: ss.mean(tasks.filter(t => t.priority === 'medium').map(t => t.actualEffort)) || 8,
        low: ss.mean(tasks.filter(t => t.priority === 'low').map(t => t.actualEffort)) || 6
      }
    };
  }
  
  async predictEffort(task) {
    try {
      if (this.regressionModel) {
        try {
          const titleLength = task.title.length / 100;
          const descriptionLength = Math.min(task.description?.length || 0, 1000) / 1000;
          const priority = task.priority === 'high' ? 1 : task.priority === 'medium' ? 0.5 : 0;
          const hasDeadline = task.dueDate ? 1 : 0;
          
          const features = [titleLength, descriptionLength, priority, hasDeadline];
          
          // Calculate prediction using weighted average from all feature regressions
          let prediction = 0;
          let totalWeight = 0;
          
          for (let i = 0; i < features.length; i++) {
            if (this.featureWeights[i]) {
              const featureContribution = 
                (this.featureWeights[i].m * features[i]) + this.featureWeights[i].b;
              
              // Higher weight for more predictive features
              const weight = Math.abs(this.featureWeights[i].m);
              prediction += featureContribution * weight;
              totalWeight += weight;
            }
          }
          
          // Get final normalized prediction and scale back to actual hours
          const normalizedPrediction = totalWeight > 0 ? prediction / totalWeight : 0.5;
          const effortPrediction = normalizedPrediction * this.maxEffort;
          
          return Math.round(effortPrediction * 2) / 2; // Round to nearest 0.5
        } catch (regressionError) {
          console.warn('Regression prediction failed, using fallback');
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