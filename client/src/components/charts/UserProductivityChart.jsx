
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

const UserProductivityChart = ({ userData }) => {
  if (!userData || !Array.isArray(userData) || userData.length === 0) {
    return <div className="text-center py-4">No user productivity data available</div>;
  }

  // Sort users by completion rate (most productive first)
  const sortedUsers = [...userData].sort((a, b) => 
    parseFloat(b.metrics.completionRate) - parseFloat(a.metrics.completionRate)
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'User Productivity'
      },
      tooltip: {
        callbacks: {
          afterBody: (context) => {
            const index = context[0].dataIndex;
            const user = sortedUsers[index];
            return [
              `Avg. Completion Time: ${user.metrics.avgCompletionTime} days`,
              `Activity Count: ${user.metrics.activityCount}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Tasks'
        }
      }
    }
  };

  const data = {
    labels: sortedUsers.map(user => user.name),
    datasets: [
      {
        label: 'Completed',
        data: sortedUsers.map(user => user.metrics.tasksCompleted),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'In Progress',
        data: sortedUsers.map(user => 
          user.metrics.tasksAssigned - user.metrics.tasksCompleted
        ),
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
      }
    ]
  };

  return (
    <div className="h-full w-full">
      <Bar options={options} data={data} />
      
      {/* Completion Rate Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">User</th>
              <th className="text-right py-2">Completion Rate</th>
              <th className="text-right py-2">Avg Completion Time</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map(user => (
              <tr key={user.userId} className="border-b hover:bg-gray-50">
                <td className="py-2">{user.name}</td>
                <td className="text-right py-2">{user.metrics.completionRate}%</td>
                <td className="text-right py-2">{user.metrics.avgCompletionTime} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserProductivityChart;