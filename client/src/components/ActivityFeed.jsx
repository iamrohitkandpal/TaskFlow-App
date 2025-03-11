import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get activities from backend on component mount
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/activities/recent');
        setActivities(response.data.activities);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch activity feed');
        setLoading(false);
        console.error('Error fetching activities:', err);
      }
    };
    
    fetchActivities();
    
    // Poll for new activities every minute (could be replaced with socket updates)
    const interval = setInterval(fetchActivities, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Helper function to format activity text
  const getActivityText = (activity) => {
    const userName = activity.user?.name || 'Someone';
    const taskTitle = activity.taskId?.title || 'a task';
    
    switch (activity.action) {
      case 'create':
        return `${userName} created task "${taskTitle}"`;
      case 'update':
        return `${userName} updated task "${taskTitle}"`;
      case 'delete':
        return `${userName} deleted task "${taskTitle}"`;
      case 'comment':
        return `${userName} commented on "${taskTitle}"`;
      case 'status_change':
        const newStatus = activity.details?.newStatus || 'a new status';
        return `${userName} changed status of "${taskTitle}" to ${newStatus}`;
      case 'assign':
        const assignee = activity.details?.assignee?.name || 'someone';
        return `${userName} assigned "${taskTitle}" to ${assignee}`;
      default:
        return `${userName} performed an action on "${taskTitle}"`;
    }
  };
  
  if (loading) return <div className="text-center py-4">Loading activities...</div>;
  if (error) return <div className="text-red-500 py-4">{error}</div>;
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
      {activities.length === 0 ? (
        <p className="text-gray-500">No recent activities</p>
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) => (
            <li key={activity._id} className="flex items-start gap-3 pb-3 border-b border-gray-100">
              {activity.user?.avatar ? (
                <img 
                  src={activity.user.avatar} 
                  alt={activity.user.name} 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {activity.user?.name?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <p className="text-sm">{getActivityText(activity)}</p>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ActivityFeed;