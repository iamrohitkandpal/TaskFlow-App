import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TaskCompletionAnalysisChart = ({ completionStats }) => {
  if (!completionStats || !completionStats.timeByPriority) {
    return <div className="text-center py-4">No completion time data available</div>;
  }

  const priorityData = completionStats.timeByPriority;
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Task Completion Time by Priority'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Days to Complete'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Task Priority'
        }
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'rgba(255, 99, 132, 0.7)'; // red
      case 'medium': return 'rgba(255, 159, 64, 0.7)'; // orange
      case 'normal': return 'rgba(255, 205, 86, 0.7)'; // yellow
      case 'low': return 'rgba(75, 192, 192, 0.7)'; // green
      default: return 'rgba(201, 203, 207, 0.7)'; // grey
    }
  };

  const priorities = Object.keys(priorityData);

  const data = {
    labels: priorities.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
    datasets: [
      {
        label: 'Average Days to Complete',
        data: priorities.map(p => parseFloat(priorityData[p])),
        backgroundColor: priorities.map(p => getPriorityColor(p)),
      }
    ]
  };

  return (
    <div className="h-full">
      <Bar options={options} data={data} />
      
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Completion Time Summary</h4>
          <div className="text-sm">
            <div className="flex justify-between mb-1">
              <span>Average Time:</span>
              <span className="font-medium">{completionStats.averageTime} days</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Median Time:</span>
              <span className="font-medium">{completionStats.medianTime} days</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Fastest Completion:</span>
              <span className="font-medium">{completionStats.fastestTime} days</span>
            </div>
            <div className="flex justify-between">
              <span>Slowest Completion:</span>
              <span className="font-medium">{completionStats.slowestTime} days</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Completion Rate by Priority</h4>
          <div className="flex flex-col space-y-2">
            {priorities.map(priority => (
              <div key={priority} className="flex items-center">
                <div className="w-3 h-3 rounded-sm mr-2" style={{backgroundColor: getPriorityColor(priority)}}></div>
                <span className="text-sm capitalize">{priority}:</span>
                <span className="text-sm ml-auto">{priorityData[priority]} days</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCompletionAnalysisChart;