import React from 'react';
import { Link } from 'react-router-dom';
import { useGetPrioritizedTasksQuery } from '../redux/slices/api/prioritizationApiSlice';
import Loader from './Loader';
import { format } from 'date-fns';

const PriorityBadge = ({ score }) => {
  let color = 'bg-gray-100 text-gray-800';
  if (score >= 100) {
    color = 'bg-red-100 text-red-800';
  } else if (score >= 70) {
    color = 'bg-orange-100 text-orange-800';
  } else if (score >= 40) {
    color = 'bg-yellow-100 text-yellow-800';
  } else if (score >= 20) {
    color = 'bg-green-100 text-green-800';
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      Priority: {score}
    </span>
  );
};

const PrioritizedTaskList = ({ userId, projectId, limit = 5 }) => {
  const { data, isLoading, error, refetch } = useGetPrioritizedTasksQuery({ userId, projectId });
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-500 py-4">
        Error loading prioritized tasks: {error.message || 'Unknown error'}
      </div>
    );
  }
  
  const tasks = data?.tasks?.slice(0, limit) || [];
  
  if (tasks.length === 0) {
    return <div className="py-4 text-gray-500">No prioritized tasks found</div>;
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Prioritized Tasks</h2>
        <button 
          onClick={() => refetch()}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>
      
      <ul className="space-y-3">
        {tasks.map(task => (
          <li key={task._id} className="border-b border-gray-100 pb-3">
            <Link to={`/task/${task._id}`} className="block hover:bg-gray-50 rounded p-2">
              <div className="flex justify-between">
                <h3 className="font-medium text-gray-800">{task.title}</h3>
                <PriorityBadge score={task.priorityScore} />
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {task.description?.length > 100 
                  ? task.description.substring(0, 100) + '...' 
                  : task.description}
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>
                  Due: {task.dueDate ? format(new Date(task.dueDate), 'MMM dd, yyyy') : 'No date set'}
                </span>
                <span className="capitalize">{task.priority || 'Normal'} priority</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PrioritizedTaskList;
