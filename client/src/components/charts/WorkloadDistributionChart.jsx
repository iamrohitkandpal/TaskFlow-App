import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const WorkloadDistributionChart = ({ data }) => {
  // If no data is available, show a placeholder
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No workload data available</p>
      </div>
    );
  }

  // Format the data for the chart
  const chartData = data.map(item => ({
    name: item.user?.name || 'Unknown',
    todoTasks: item.tasks?.todo || 0,
    inProgressTasks: item.tasks?.inProgress || 0,
    reviewTasks: item.tasks?.review || 0,
    totalTasks: item.totalTasks,
    avatar: item.user?.avatar
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 45,
        }}
        barSize={20}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          angle={-45}
          textAnchor="end"
          height={70}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          formatter={(value, name) => {
            const formattedName = 
              name === 'todoTasks' ? 'To Do' : 
              name === 'inProgressTasks' ? 'In Progress' : 
              name === 'reviewTasks' ? 'In Review' : 'Total Tasks';
            return [value, formattedName];
          }}
        />
        <Legend />
        <Bar dataKey="todoTasks" stackId="a" fill="#8884d8" name="To Do" />
        <Bar dataKey="inProgressTasks" stackId="a" fill="#82ca9d" name="In Progress" />
        <Bar dataKey="reviewTasks" stackId="a" fill="#ffc658" name="In Review" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default WorkloadDistributionChart;