import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

const TaskProgressMetricsChart = ({ progressionData }) => {
  if (!progressionData) {
    return <div className="text-center py-4">No task progression data available</div>;
  }

  const { averageTimeToStart, averageTimeInProgress, averageTimeToComplete, taskCounts } = progressionData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Task Progress Issues'
      }
    }
  };

  const data = {
    labels: ['Stalled Tasks', 'Blocked Tasks', 'Critical Tasks'],
    datasets: [
      {
        data: [
          taskCounts.stalled,
          taskCounts.blocked,
          taskCounts.critical
        ],
        backgroundColor: [
          'rgba(255, 206, 86, 0.7)', // yellow for stalled
          'rgba(255, 99, 132, 0.7)', // red for blocked
          'rgba(54, 162, 235, 0.7)'  // blue for critical
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1 flex flex-col items-center justify-center">
        <div className="h-48">
          <Doughnut options={options} data={data} />
        </div>
      </div>
      
      <div className="md:col-span-2">
        <h4 className="text-base font-medium mb-3">Task Progression Timeline</h4>
        <div className="relative pt-1">
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                Creation to Started
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-600">
                {averageTimeToStart} days
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
            <div style={{ width: '33%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
          </div>
          
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">
                In Progress Period
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-yellow-600">
                {averageTimeInProgress} days
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-yellow-200">
            <div style={{ width: '33%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"></div>
          </div>
          
          <div className="flex items-center justify-between mb-1">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                Total Completion Time
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-green-600">
                {averageTimeToComplete} days
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
            <div style={{ width: '100%' }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-yellow-50 rounded-md">
            <p className="text-sm font-medium text-yellow-700">Stalled Tasks</p>
            <p className="text-lg font-bold text-yellow-800">{taskCounts.stalled}</p>
          </div>
          <div className="p-2 bg-red-50 rounded-md">
            <p className="text-sm font-medium text-red-700">Blocked Tasks</p>
            <p className="text-lg font-bold text-red-800">{taskCounts.blocked}</p>
          </div>
          <div className="p-2 bg-blue-50 rounded-md">
            <p className="text-sm font-medium text-blue-700">Critical Tasks</p>
            <p className="text-lg font-bold text-blue-800">{taskCounts.critical}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskProgressMetricsChart;