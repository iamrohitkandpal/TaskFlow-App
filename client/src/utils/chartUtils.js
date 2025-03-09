/**
 * Transforms raw task data into a format suitable for charts
 * 
 * @param {Array} tasks - Raw task data from API
 * @returns {Object} - Transformed data for different chart types
 */
export const prepareChartData = (tasks = []) => {
  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return {
      priorityData: [],
      stageData: [],
      timelineData: []
    };
  }

  // Group by priority
  const priorityGroups = tasks.reduce((acc, task) => {
    const priority = task.priority || 'undefined';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  // Group by stage
  const stageGroups = tasks.reduce((acc, task) => {
    const stage = task.stage || 'undefined';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  // Format for charts
  const priorityData = Object.entries(priorityGroups).map(([name, total]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize
    total
  }));

  const stageData = Object.entries(stageGroups).map(([name, total]) => ({
    name: name === 'todo' ? 'To Do' : 
          name === 'in progress' ? 'In Progress' : 
          name.charAt(0).toUpperCase() + name.slice(1),
    total
  }));

  return {
    priorityData,
    stageData
  };
};

/**
 * Generates dynamic colors based on category
 * 
 * @param {string} category - Category name (priority, stage, etc)
 * @param {string} value - Value to get color for
 * @returns {string} - HEX color code
 */
export const getDynamicColor = (category, value) => {
  const priorities = {
    high: '#FF5252',
    medium: '#FFA726',
    normal: '#4CAF50',
    low: '#2196F3'
  };

  const stages = {
    todo: '#42A5F5',
    'in progress': '#FFA726',
    completed: '#66BB6A'
  };

  if (category === 'priority') {
    return priorities[value.toLowerCase()] || '#9E9E9E';
  } else if (category === 'stage') {
    return stages[value.toLowerCase()] || '#9E9E9E';
  }

  return '#9E9E9E'; // Default gray
};
