import {
  getAllAnalytics,
  getTaskCompletionTime,
  getWorkloadDistribution,
  getTaskStatusDistribution,
  generateBurndownChartData,
  getProductivityTrend,
  getEnhancedTaskCompletionStats,
  getUserProductivityMetrics,
  getTaskProgressionMetrics
} from '../services/analytics.service.js';

// Get all analytics data
export const getAnalyticsData = async (req, res) => {
  try {
    const analytics = await getAllAnalytics();
    
    res.status(200).json({
      status: true,
      message: "Analytics data retrieved successfully",
      analytics
    });
  } catch (error) {
    console.error('Error in getAnalyticsData controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Get task completion time
export const getAverageCompletionTime = async (req, res) => {
  try {
    const completionTime = await getTaskCompletionTime();
    
    res.status(200).json({
      status: true,
      message: "Average task completion time retrieved successfully",
      completionTime
    });
  } catch (error) {
    console.error('Error in getAverageCompletionTime controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Get workload distribution
export const getWorkloadData = async (req, res) => {
  try {
    const workloadData = await getWorkloadDistribution();
    
    res.status(200).json({
      status: true,
      message: "Workload distribution data retrieved successfully",
      workloadData
    });
  } catch (error) {
    console.error('Error in getWorkloadData controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Get task status distribution
export const getStatusDistribution = async (req, res) => {
  try {
    const statusData = await getTaskStatusDistribution();
    
    res.status(200).json({
      status: true,
      message: "Task status distribution retrieved successfully",
      statusData
    });
  } catch (error) {
    console.error('Error in getStatusDistribution controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Get burndown chart data
export const getBurndownData = async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 14;
    const burndownData = await generateBurndownChartData(days);
    
    res.status(200).json({
      status: true,
      message: "Burndown chart data retrieved successfully",
      burndownData
    });
  } catch (error) {
    console.error('Error in getBurndownData controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Get productivity trend
export const getProductivityData = async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 7;
    const productivityData = await getProductivityTrend(days);
    
    res.status(200).json({
      status: true,
      message: "Productivity trend data retrieved successfully",
      productivityData
    });
  } catch (error) {
    console.error('Error in getProductivityData controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Get enhanced completion time statistics
export const getEnhancedCompletionStats = async (req, res) => {
  try {
    const stats = await getEnhancedTaskCompletionStats();
    
    res.status(200).json({
      status: true,
      message: "Enhanced completion statistics retrieved successfully",
      stats
    });
  } catch (error) {
    console.error('Error in getEnhancedCompletionStats controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Get user productivity metrics
export const getUserProductivityData = async (req, res) => {
  try {
    const productivityData = await getUserProductivityMetrics();
    
    res.status(200).json({
      status: true,
      message: "User productivity metrics retrieved successfully",
      productivityData
    });
  } catch (error) {
    console.error('Error in getUserProductivityData controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error. Please try again later.'
    });
  }
};

// Get task progression metrics
export const getTaskProgressionData = async (req, res) => {
  try {
    const progressionData = await getTaskProgressionMetrics();
    
    res.status(200).json({
      status: true,
      message: "Task progression metrics retrieved successfully",
      progressionData
    });
  } catch (error) {
    console.error('Error in getTaskProgressionData controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error. Please try again later.'
    });
  }
};