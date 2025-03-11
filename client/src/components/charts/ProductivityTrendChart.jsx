import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const ProductivityTrendChart = ({ data, timeRange }) => {
  // If no data is available, show a placeholder
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No productivity data available</p>
      </div>
    );
  }

  // Format the data for the chart
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    tasksCompleted: item.tasksCompleted,
    avgCompletionTime: item.avgCompletionTime
  }));

  // Calculate average completion over the entire period for the reference line
  const avgOverTime = chartData.reduce((sum, item) => sum + item.tasksCompleted, 0) / chartData.length;

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
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          formatter={(value, name) => [
            name === 'tasksCompleted' ? `${value} tasks` : `${value.toFixed(1)} hours`, 
            name === 'tasksCompleted' ? 'Tasks Completed' : 'Avg. Completion Time'
          ]}
        />
        <Legend />
        <ReferenceLine 
          y={avgOverTime} 
          yAxisId="left"
          label="Avg. Tasks" 
          stroke="#ff7300" 
          strokeDasharray="3 3" 
        />
        <Line 
          type="monotone" 
          dataKey="tasksCompleted" 
          stroke="#8884d8" 
          activeDot={{ r: 8 }} 
          yAxisId="left" 
          name="Tasks Completed"
        />
        <Line 
          type="monotone" 
          dataKey="avgCompletionTime" 
          stroke="#82ca9d" 
          yAxisId="right" 
          name="Avg. Completion Time (hours)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ProductivityTrendChart;