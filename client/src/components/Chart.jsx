import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,siveContainer,
  Cell,
} from "recharts";
tive, payload, label }) => {
const CustomTooltip = ({ active, payload, label }) => {ve && payload && payload.length) {
  if (active && payload && payload.length) {
    return (-md border border-gray-100">
      <div className="bg-white p-3 shadow-md rounded-md border border-gray-100">ay-800">{`${label}`}</p>
        <p className="text-sm font-medium text-gray-800">{`${label} Priority`}</p>lue-600">{`Tasks: ${payload[0].value}`}</p>
        <p className="text-sm font-semibold text-blue-600">{`Tasks: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};
t Chart = ({ data = [] }) => {
const Chart = ({ data = [] }) => {// Apply consistent coloring based on priority
  // Apply consistent coloring based on priority  const getBarColor = (name) => {
  const getBarColor = (name) => {werCase()) {
    switch (name.toLowerCase()) {      case 'high':













































































export default Chart;};  );    </div>      </ResponsiveContainer>        </BarChart>          </Bar>            ))}              />                fill={getBarColor(entry.name)}                key={`cell-${index}`}               <Cell             {formattedData.map((entry, index) => (          >            }}              fontWeight: 500               fontSize: 12,              fill: '#4B5563',               position: 'top',             label={{             fillOpacity={0.8}            isAnimationActive={true}            animationEasing="ease-out"            animationDuration={1500}            barSize={40}            radius={[4, 4, 0, 0]}            name="Tasks"             dataKey="total"           <Bar           <Legend wrapperStyle={{ paddingTop: 10 }} />          <Tooltip content={<CustomTooltip />} />          />            axisLine={{ stroke: '#D1D5DB' }}            tickLine={{ stroke: '#9CA3AF' }}            tick={{ fontSize: 12, fill: '#4B5563' }}          <YAxis           />            axisLine={{ stroke: '#D1D5DB' }}            tickLine={{ stroke: '#9CA3AF' }}            tick={{ fontSize: 12, fill: '#4B5563' }}            dataKey="name"           <XAxis           <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />        >          }}            bottom: 25,            left: 20,            right: 30,            top: 20,          margin={{          data={formattedData}        <BarChart      <ResponsiveContainer width="100%" height="90%">      <h3 className="font-bold text-gray-700 mb-4">Task Distribution by Priority</h3>    <div className="h-80 w-full bg-white p-4 rounded-lg shadow-sm">  return (    });    return (order[a.name.toLowerCase()] || 5) - (order[b.name.toLowerCase()] || 5);    const order = { high: 1, medium: 2, normal: 3, low: 4 };  const formattedData = [...data].sort((a, b) => {  // Process data to sort by priority  };    }        return '#6366F1'; // indigo-500      default:        return '#10B981'; // emerald-500      case 'low':        return '#3B82F6'; // blue-500      case 'normal':        return '#F59E0B'; // amber-500      case 'medium':        return '#EF4444'; // red-500      case 'high':        return '#EF4444'; // red-500
      case 'medium':
        return '#F59E0B'; // amber-500
      case 'normal':
        return '#3B82F6'; // blue-500
      case 'low':
        return '#10B981'; // emerald-500
      default:
        return '#6366F1'; // indigo-500
    }
  };

  // Process data to sort by priority
  const formattedData = [...data].sort((a, b) => {
    const order = { high: 1, medium: 2, normal: 3, low: 4 };
    return (order[a.name.toLowerCase()] || 5) - (order[b.name.toLowerCase()] || 5);
  });
  
  return (
    <div className="h-80 w-full bg-white p-4 rounded-lg shadow-sm">
      <h3 className="font-bold text-gray-700 mb-4">Task Distribution by Priority</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={formattedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 25,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12, fill: '#4B5563' }}
            tickLine={{ stroke: '#9CA3AF' }}
            axisLine={{ stroke: '#D1D5DB' }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#4B5563' }}
            tickLine={{ stroke: '#9CA3AF' }}
            axisLine={{ stroke: '#D1D5DB' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 10 }} />
          <Bar 
            dataKey="total" 
            name="Tasks" 
            radius={[4, 4, 0, 0]}
            barSize={40}
            fill="#6366F1"
            fillOpacity={0.9}
            animationDuration={1500}
            animationEasing="ease-out"
            isAnimationActive={true}
            fillOpacity={0.8}
            label={{ 
              position: 'top', 
              fill: '#4B5563', 
              fontSize: 12,
              fontWeight: 500 
            }}











export default Chart;};  );    </div>      </ResponsiveContainer>

        </BarChart>          </Bar>            ))}              />                fill={getBarColor(entry.name)}                key={`cell-${index}`}           >
            {formattedData.map((entry, index) => (
              <Cell 