import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const TaskStatusPieChart = ({ data }) => {
  // If no data is available, show a placeholder
  if (!data || !data.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No status distribution data available</p>
      </div>
    );
  }

  // Format data for the chart
  const chartData = [
    { name: 'To Do', value: data.find(item => item.status === 'todo')?.count || 0 },
    { name: 'In Progress', value: data.find(item => item.status === 'inProgress')?.count || 0 },
    { name: 'In Review', value: data.find(item => item.status === 'review')?.count || 0 },
    { name: 'Completed', value: data.find(item => item.status === 'done')?.count || 0 }
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [value, name]}
          contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TaskStatusPieChart;