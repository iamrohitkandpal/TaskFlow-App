import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { FaCircle } from 'react-icons/fa';
import Loader from './Loader';

const ActivityFeed = ({ limit = 10 }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useSelector(state => state.auth);
  
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/activities/recent', {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit }
        });
        setActivities(response.data.activities);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch activity feed');
        setLoading(false);
      }
    };
    
    fetchActivities();
    
    // Poll for new activities every minute
    const interval = setInterval(fetchActivities, 60000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [token, limit]);

  if (loading) return <Loader />;
  
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  
  if (activities.length === 0) {
    return <div className="p-4 text-gray-500">No recent activities</div>;
  }

  return (
    <div className="bg-white p-4 rounded-md shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity._id} className="flex items-start gap-3">
            <div className="mt-1">
              <FaCircle className="text-blue-500" size={12} />
            </div>
            <div>
              <p className="text-sm">
                <span className="font-medium">{activity.user?.name}</span> {activity.description}
              </p>
              <div className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;