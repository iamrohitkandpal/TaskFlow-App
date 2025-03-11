import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BurndownChart = ({ data, timeRange }) => {
  // If no data is available, show a placeholder
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No burndown data available</p>
      </div>
    );
  }

  // Format the data for the chart
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    remaining: item.remaining,
    ideal: item.ideal,
    completed: item.completed
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          formatter={(value, name) => [value, name === 'ideal' ? 'Ideal Completion' : (name === 'remaining' ? 'Remaining Tasks' : 'Completed Tasks')]}
        />
        <Legend />
        <Line type="monotone" dataKey="remaining" stroke="#ff7300" activeDot={{ r: 8 }} name="Remaining Tasks" />
        <Line type="monotone" dataKey="ideal" stroke="#82ca9d" strokeDasharray="5 5" name="Ideal Completion" />
        <Line type="monotone" dataKey="completed" stroke="#8884d8" name="Completed Tasks" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default BurndownChart;