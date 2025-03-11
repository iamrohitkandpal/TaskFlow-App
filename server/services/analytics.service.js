import Task from '../models/task.model.js';
import User from '../models/user.model.js';
import Activity from '../models/activity.model.js';
import moment from 'moment';

// Calculate task completion time (average days from creation to completion)
export const getTaskCompletionTime = async () => {
  try {
    const completedTasks = await Task.find({ 
      stage: 'completed',
      isTrashed: false
    });
    
    let totalDays = 0;
    let validTaskCount = 0;
    
    completedTasks.forEach(task => {
      if (task.createdAt) {
        const completedActivity = task.activities.find(a => a.type === 'completed');
        if (completedActivity && completedActivity.date) {
          const creationDate = moment(task.createdAt);
          const completionDate = moment(completedActivity.date);
          const daysDiff = completionDate.diff(creationDate, 'days', true); // true for floating point
          
          if (daysDiff >= 0) {
            totalDays += daysDiff;
            validTaskCount++;
          }
        }
      }
    });
    
    return validTaskCount > 0 ? (totalDays / validTaskCount).toFixed(1) : 0;
  } catch (error) {
    console.error('Error in getTaskCompletionTime:', error);
    throw error;
  }
};

// Calculate workload distribution among team members
export const getWorkloadDistribution = async () => {
  try {
    const users = await User.find({ isActive: true }).select('_id name title');
    
    const workloadData = {
      teamMembers: [],
      todoTasks: [],
      inProgressTasks: [],
      completedTasks: []
    };
    
    for (const user of users) {
      workloadData.teamMembers.push({ 
        id: user._id,
        name: user.name,
        title: user.title
      });
      
      // Count tasks in each status for this user
      const todoCount = await Task.countDocuments({ 
        team: user._id,
        stage: 'todo',
        isTrashed: false
      });
      
      const inProgressCount = await Task.countDocuments({ 
        team: user._id,
        stage: 'in progress',
        isTrashed: false
      });
      
      const completedCount = await Task.countDocuments({ 
        team: user._id,
        stage: 'completed',
        isTrashed: false
      });
      
      workloadData.todoTasks.push(todoCount);
      workloadData.inProgressTasks.push(inProgressCount);
      workloadData.completedTasks.push(completedCount);
    }
    
    return workloadData;
  } catch (error) {
    console.error('Error in getWorkloadDistribution:', error);
    throw error;
  }
};

// Calculate task status distribution
export const getTaskStatusDistribution = async () => {
  try {
    const todoCount = await Task.countDocuments({ 
      stage: 'todo',
      isTrashed: false
    });
    
    const inProgressCount = await Task.countDocuments({ 
      stage: 'in progress',
      isTrashed: false
    });
    
    const completedCount = await Task.countDocuments({ 
      stage: 'completed',
      isTrashed: false
    });
    
    return {
      statusCounts: {
        todo: todoCount,
        'in progress': inProgressCount,
        completed: completedCount
      }
    };
  } catch (error) {
    console.error('Error in getTaskStatusDistribution:', error);
    throw error;
  }
};

// Generate data for burndown chart
export const generateBurndownChartData = async (daysToShow = 14) => {
  try {
    const endDate = moment().endOf('day');
    const startDate = moment().subtract(daysToShow - 1, 'days').startOf('day');
    
    const tasks = await Task.find({
      createdAt: { $lte: endDate.toDate() },
      isTrashed: false
    });
    
    const dates = [];
    const completedCounts = [];
    const remainingCounts = [];
    const idealCounts = [];
    
    // Calculate total tasks at the start
    const totalTasks = tasks.filter(task => 
      moment(task.createdAt).isSameOrBefore(startDate)
    ).length;
    
    // Calculate ideal burndown (straight line from start to end)
    const idealTasksPerDay = totalTasks / daysToShow;
    
    // For each day in the range
    for (let i = 0; i < daysToShow; i++) {
      const currentDate = moment(startDate).add(i, 'days');
      dates.push(currentDate.format('MMM DD'));
      
      // Count completed tasks up to this day
      const completedCount = tasks.filter(task => {
        const completedActivity = task.activities.find(a => a.type === 'completed');
        return completedActivity && 
               moment(completedActivity.date).isSameOrBefore(currentDate, 'day');
      }).length;
      
      completedCounts.push(completedCount);
      
      // Calculate remaining tasks
      remainingCounts.push(Math.max(0, totalTasks - completedCount));
      
      // Calculate ideal remaining tasks
      idealCounts.push(Math.max(0, totalTasks - (idealTasksPerDay * i)));
    }
    
    return {
      dates,
      completed: completedCounts,
      remaining: remainingCounts,
      ideal: idealCounts
    };
  } catch (error) {
    console.error('Error in generateBurndownChartData:', error);
    throw error;
  }
};

// Generate productivity trend data
export const getProductivityTrend = async (daysToShow = 7) => {
  try {
    const endDate = moment().endOf('day');
    const startDate = moment().subtract(daysToShow - 1, 'days').startOf('day');
    
    const dates = [];
    const tasksCreated = [];
    const tasksCompleted = [];
    
    // For each day in the range
    for (let i = 0; i < daysToShow; i++) {
      const currentDate = moment(startDate).add(i, 'days');
      const nextDate = moment(currentDate).add(1, 'days');
      
      dates.push(currentDate.format('ddd'));
      
      // Count tasks created on this day
      const createdCount = await Task.countDocuments({
        createdAt: {
          $gte: currentDate.toDate(),
          $lt: nextDate.toDate()
        }
      });
      
      tasksCreated.push(createdCount);
      
      // Count tasks completed on this day
      const completedCount = await Task.countDocuments({
        'activities.type': 'completed',
        'activities.date': {
          $gte: currentDate.toDate(),
          $lt: nextDate.toDate()
        }
      });
      
      tasksCompleted.push(completedCount);
    }
    
    return {
      dates,
      tasksCreated,
      tasksCompleted
    };
  } catch (error) {
    console.error('Error in getProductivityTrend:', error);
    throw error;
  }
};

// Enhanced task completion time with percentile breakdowns
export const getEnhancedTaskCompletionStats = async () => {
  try {
    const completedTasks = await Task.find({ 
      stage: 'completed',
      isTrashed: false
    });
    
    if (completedTasks.length === 0) {
      return {
        averageTime: 0,
        fastestTime: 0,
        slowestTime: 0,
        medianTime: 0,
        timeByPriority: {
          high: 0,
          medium: 0,
          normal: 0,
          low: 0
        }
      };
    }

    // Calculate completion times for all tasks
    const completionTimes = [];
    const timesByPriority = {
      high: [],
      medium: [],
      normal: [],
      low: []
    };
    
    completedTasks.forEach(task => {
      if (task.createdAt) {
        const completedActivity = task.activities.find(a => a.type === 'completed');
        if (completedActivity && completedActivity.date) {
          const creationDate = moment(task.createdAt);
          const completionDate = moment(completedActivity.date);
          const daysDiff = completionDate.diff(creationDate, 'days', true);
          
          if (daysDiff >= 0) {
            completionTimes.push(daysDiff);
            
            // Group by priority
            if (timesByPriority[task.priority]) {
              timesByPriority[task.priority].push(daysDiff);
            }
          }
        }
      }
    });
    
    // Sort times for percentile calculations
    completionTimes.sort((a, b) => a - b);
    
    // Calculate average, median, fastest and slowest times
    const averageTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    const medianTime = completionTimes.length % 2 === 0 
      ? (completionTimes[completionTimes.length/2 - 1] + completionTimes[completionTimes.length/2]) / 2
      : completionTimes[Math.floor(completionTimes.length/2)];
    
    // Calculate average time by priority
    const timeByPriority = {};
    Object.keys(timesByPriority).forEach(priority => {
      const times = timesByPriority[priority];
      timeByPriority[priority] = times.length > 0 
        ? times.reduce((sum, time) => sum + time, 0) / times.length 
        : 0;
    });
    
    return {
      averageTime: averageTime.toFixed(1),
      fastestTime: completionTimes[0].toFixed(1),
      slowestTime: completionTimes[completionTimes.length - 1].toFixed(1),
      medianTime: medianTime.toFixed(1),
      timeByPriority
    };
  } catch (error) {
    console.error('Error in getEnhancedTaskCompletionStats:', error);
    throw error;
  }
};

// Get user productivity metrics
export const getUserProductivityMetrics = async () => {
  try {
    const users = await User.find({ isActive: true }).select('_id name title');
    const userProductivity = [];
    
    for (const user of users) {
      // Tasks assigned
      const assignedCount = await Task.countDocuments({ 
        team: user._id,
        isTrashed: false
      });
      
      // Tasks completed
      const completedCount = await Task.countDocuments({
        team: user._id,
        stage: 'completed',
        isTrashed: false
      });
      
      // Average completion time
      const userTasks = await Task.find({
        team: user._id,
        stage: 'completed',
        isTrashed: false
      });
      
      let totalCompletionDays = 0;
      let tasksWithCompletionData = 0;
      
      userTasks.forEach(task => {
        const completedActivity = task.activities.find(a => a.type === 'completed');
        if (completedActivity && completedActivity.date && task.createdAt) {
          const daysDiff = moment(completedActivity.date).diff(moment(task.createdAt), 'days', true);
          if (daysDiff >= 0) {
            totalCompletionDays += daysDiff;
            tasksWithCompletionData++;
          }
        }
      });
      
      const avgCompletionTime = tasksWithCompletionData > 0 
        ? (totalCompletionDays / tasksWithCompletionData).toFixed(1)
        : 0;
      
      // Activity frequency (last 30 days)
      const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
      
      const activityCount = await Activity.countDocuments({
        user: user._id,
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      userProductivity.push({
        userId: user._id,
        name: user.name,
        title: user.title,
        metrics: {
          tasksAssigned: assignedCount,
          tasksCompleted: completedCount,
          completionRate: assignedCount > 0 ? ((completedCount / assignedCount) * 100).toFixed(1) : 0,
          avgCompletionTime,
          activityCount
        }
      });
    }
    
    return userProductivity;
  } catch (error) {
    console.error('Error in getUserProductivityMetrics:', error);
    throw error;
  }
};

// Get timeline analysis for task stages
export const getTaskProgressionMetrics = async () => {
  try {
    const tasks = await Task.find({
      isTrashed: false
    }).select('createdAt activities stage');
    
    const metrics = {
      averageTimeToStart: 0,  // Time between creation and "started" status
      averageTimeInProgress: 0, // Time between "started" and "completed" status
      averageTimeToComplete: 0, // Overall time to complete
      taskCounts: {
        stalled: 0,  // Tasks older than 14 days with no progress
        blocked: 0,  // Tasks marked with "bug" activity but not resolved
        critical: 0   // High priority tasks close to deadline
      }
    };
    
    let startedCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    
    tasks.forEach(task => {
      const activities = task.activities || [];
      
      // Find key timestamps
      const creationTime = moment(task.createdAt);
      const startedActivity = activities.find(a => a.type === 'started');
      const inProgressActivity = activities.find(a => a.type === 'in progress');
      const completedActivity = activities.find(a => a.type === 'completed');
      
      // Calculate time to start
      if (startedActivity && startedActivity.date) {
        const timeToStart = moment(startedActivity.date).diff(creationTime, 'days', true);
        if (timeToStart >= 0) {
          metrics.averageTimeToStart += timeToStart;
          startedCount++;
        }
      }
      
      // Calculate time in progress
      if (inProgressActivity && completedActivity && inProgressActivity.date && completedActivity.date) {
        const timeInProgress = moment(completedActivity.date).diff(moment(inProgressActivity.date), 'days', true);
        if (timeInProgress >= 0) {
          metrics.averageTimeInProgress += timeInProgress;
          inProgressCount++;
        }
      }
      
      // Calculate total time to complete
      if (completedActivity && completedActivity.date) {
        const timeToComplete = moment(completedActivity.date).diff(creationTime, 'days', true);
        if (timeToComplete >= 0) {
          metrics.averageTimeToComplete += timeToComplete;
          completedCount++;
        }
      }
      
      // Check for stalled tasks
      const twoWeeksAgo = moment().subtract(14, 'days');
      const hasRecentActivity = activities.some(a => moment(a.date).isAfter(twoWeeksAgo));
      if (task.stage !== 'completed' && creationTime.isBefore(twoWeeksAgo) && !hasRecentActivity) {
        metrics.taskCounts.stalled++;
      }
      
      // Check for blocked tasks
      const hasBug = activities.some(a => a.type === 'bug');
      const bugResolved = hasBug && activities.some(a => a.type === 'completed' && moment(a.date).isAfter(
        moment(activities.find(a => a.type === 'bug').date)
      ));
      if (hasBug && !bugResolved && task.stage !== 'completed') {
        metrics.taskCounts.blocked++;
      }
    });
    
    // Calculate averages
    if (startedCount > 0) metrics.averageTimeToStart = (metrics.averageTimeToStart / startedCount).toFixed(1);
    if (inProgressCount > 0) metrics.averageTimeInProgress = (metrics.averageTimeInProgress / inProgressCount).toFixed(1);
    if (completedCount > 0) metrics.averageTimeToComplete = (metrics.averageTimeToComplete / completedCount).toFixed(1);
    
    return metrics;
  } catch (error) {
    console.error('Error in getTaskProgressionMetrics:', error);
    throw error;
  }
};

// Get all analytics in one call
export const getAllAnalytics = async () => {
  try {
    const [
      completionTime,
      workloadDistribution,
      taskStatusDistribution,
      burndownData,
      productivityTrend,
      enhancedCompletionStats,
      userProductivity,
      taskProgressionMetrics
    ] = await Promise.all([
      getTaskCompletionTime(),
      getWorkloadDistribution(),
      getTaskStatusDistribution(),
      generateBurndownChartData(),
      getProductivityTrend(),
      getEnhancedTaskCompletionStats(),
      getUserProductivityMetrics(),
      getTaskProgressionMetrics()
    ]);
    
    return {
      completionTime,
      workloadDistribution,
      taskStatusDistribution,
      burndownData,
      productivityTrend,
      enhancedCompletionStats,
      userProductivity,
      taskProgressionMetrics
    };
  } catch (error) {
    console.error('Error in getAllAnalytics:', error);
    throw error;
  }
};