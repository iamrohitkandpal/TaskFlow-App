import * as ss from 'simple-statistics';
import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import { MultivariateLinearRegression } from 'ml-regression-multivariate-linear';

class EffortEstimationService {
  constructor() {
    this.linearModel = null;
    this.multiModel = null;
    this.fallbackModel = null;
    this.featureScaler = null;
    this.targetScaler = null;
  }
  
  // Train models based on historical task data
  trainModel(tasks) {
    try {
      // Filter out tasks without effort data
      const validTasks = tasks.filter(task => 
        task.actualEffort && task.title && task.description);
      
      if (validTasks.length < 5) {
        console.log('Not enough data to train model, using fallback');
        this.trainFallbackModel(validTasks);
        return false;
      }
      
      // Extract features and target
      const features = this.extractFeatures(validTasks);
      const targets = validTasks.map(task => task.actualEffort);
      
      // Try multivariate regression if we have enough data
      if (validTasks.length >= 10) {
        try {
          this.trainMultivariateModel(features, targets);
          console.log('Multivariate regression model trained successfully');
          return true;
        } catch (multiError) {
          console.warn('Failed to train multivariate model, trying simple regression:', multiError);
        }
      }
      
      // Fallback to simple linear regression with just one feature
      try {
        // Use title length as the single predictor
        const simpleFeatures = validTasks.map(task => task.title.length);
        this.trainSimpleModel(simpleFeatures, targets);
        console.log('Simple linear regression model trained successfully');
        return true;
      } catch (simpleError) {
        console.warn('Failed to train simple regression model, using fallback:', simpleError);
        this.trainFallbackModel(validTasks);
        return false;
      }
    } catch (error) {
      console.error('Error training effort estimation model:', error);
      this.trainFallbackModel(tasks.filter(t => t.actualEffort));
      return false;
    }
  }
  
  // Train a multivariate linear regression model
  trainMultivariateModel(features, targets) {
    // Normalize data
    this.featureScaler = this.createScaler(features);
    this.targetScaler = this.createScaler([targets]);
    
    const scaledFeatures = this.featureScaler.transform(features);
    const scaledTargets = this.targetScaler.transform([targets])[0];
    
    // Create and train multivariate model
    this.multiModel = new MultivariateLinearRegression(scaledFeatures, scaledTargets);
  }
  
  // Train a simple linear regression model
  trainSimpleModel(features, targets) {
    this.linearModel = new SimpleLinearRegression(features, targets);
  }
  
  // Train a simple statistical model as ultimate fallback
  trainFallbackModel(tasks) {
    // If we have very limited data, just use the mean/median
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
  
  // Extract features from tasks
  extractFeatures(tasks) {
    return tasks.map(task => {
      const features = [
        task.title.length, // Title length
        task.description ? task.description.length : 0, // Description length
        task.priority === 'high' ? 2 : task.priority === 'medium' ? 1 : 0, // Priority
        task.dueDate ? 1 : 0, // Has deadline
      ];
      
      return features;
    });
  }
  
  // Create a min-max scaler
  createScaler(data) {
    // Transpose the data to get columns
    const columns = data[0].map((_, colIndex) => 
      data.map(row => row[colIndex])
    );
    
    // Find min and max for each column
    const mins = columns.map(col => Math.min(...col));
    const maxs = columns.map(col => Math.max(...col));
    
    return {
      transform: (data) => {
        return data.map(row => 
          row.map((val, i) => 
            (val - mins[i]) / (maxs[i] - mins[i] || 1)
          )
        );
      },
      inverseTransform: (data) => {
        return data.map(row =>
          row.map((val, i) =>
            val * (maxs[i] - mins[i] || 1) + mins[i]
          )
        );
      }
    };
  }
  
  // Predict effort for a new task
  predictEffort(task) {
    try {
      // Try multivariate model first
      if (this.multiModel) {
        try {
          const features = this.extractFeatures([task]);
          const scaledFeatures = this.featureScaler.transform(features);
          
          const scaledPrediction = this.multiModel.predict(scaledFeatures[0]);
          const [transformedPrediction] = this.targetScaler.inverseTransform([[scaledPrediction]]);
          
          return Math.round(transformedPrediction[0] * 2) / 2; // Round to nearest 0.5
        } catch (multiError) {
          console.warn('Multivariate prediction failed, trying simple regression', multiError);
        }
      }
      
      // Try simple linear regression if multivariate fails
      if (this.linearModel) {
        try {
          const prediction = this.linearModel.predict(task.title.length);
          return Math.max(1, Math.round(prediction * 2) / 2); // Ensure minimum of 1 hour
        } catch (linearError) {
          console.warn('Simple regression prediction failed, using fallback', linearError);
        }
      }
      
      // Use fallback model
      if (this.fallbackModel) {
        if (task.priority && this.fallbackModel.byPriority[task.priority]) {
          return this.fallbackModel.byPriority[task.priority];
        }
        return this.fallbackModel.median || this.fallbackModel.mean || 8;
      }
      
      // Ultimate fallback - use rules of thumb
      if (task.priority === 'high') return 10;
      if (task.priority === 'medium') return 8;
      return 6; // Default/low priority
    } catch (error) {
      console.error('Error predicting effort:', error);
      return 8; // Default to 8 hours on error
    }
  }
}

// Singleton instance
const effortEstimationService = new EffortEstimationService();
export default effortEstimationService;