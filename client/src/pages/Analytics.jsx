import React, { useState } from 'react';
import { useGetAllAnalyticsQuery } from '../redux/slices/api/analyticsApiSlice';
import BurndownChart from '../components/charts/BurndownChart';
import WorkloadDistributionChart from '../components/charts/WorkloadDistributionChart';
import TaskStatusPieChart from '../components/charts/TaskStatusPieChart';
import ProductivityTrendChart from '../components/charts/ProductivityTrendChart';
import Loader from '../components/Loader';
import Title from '../components/Title';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('14'); // default to 14 days
  const { data, isLoading, error, refetch } = useGetAllAnalyticsQuery(timeRange);

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) return <Loader />;
  
  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-500">Error loading analytics: {error.message || 'Unknown error'}</p>
        <button 
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const analytics = data?.analytics || {};

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
    // This will auto-refetch data with the new time range thanks to the query parameter
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <Title title="Analytics Dashboard" />
        
        <div className="flex items-center space-x-4">
          <label htmlFor="timeRange" className="text-sm text-gray-600">Time Range:</label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
          </select>
          
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={handleRefresh}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Task Status Distribution</h3>
          <div className="h-64">
            <TaskStatusPieChart data={analytics.taskStatusDistribution} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Average Completion Time</h3>
          <div className="h-64 flex flex-col items-center justify-center">
            {analytics.completionTime ? (
              <>
                <div className="text-5xl font-bold text-blue-600 mb-2">{analytics.completionTime.avgDays.toFixed(1)}</div>
                <div className="text-xl text-gray-600">Days per Task</div>
                <div className="mt-4 text-sm text-gray-500">
                  Based on {analytics.completionTime.totalTasks} completed tasks
                </div>
              </>
            ) : (
              <p className="text-gray-500">No completion time data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Workload Distribution</h3>
          <div className="h-64">
            <WorkloadDistributionChart data={analytics.workloadDistribution} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Burndown Chart</h3>
          <div className="h-64">
            <BurndownChart data={analytics.burndownData} timeRange={timeRange} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">Productivity Trend</h3>
          <div className="h-64">
            <ProductivityTrendChart data={analytics.productivityTrend} timeRange={timeRange} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-3">User Productivity</h3>
          <div className="h-64">
            {analytics.userProductivity && analytics.userProductivity.length > 0 ? (
              <div className="overflow-auto h-full">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Tasks Completed</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Avg. Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.userProductivity.map((user, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-2 px-3 whitespace-nowrap">{user.name}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{user.tasksCompleted}</td>
                        <td className="py-2 px-3 whitespace-nowrap">{user.avgCompletionTime.toFixed(1)} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 mt-8">No user productivity data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;