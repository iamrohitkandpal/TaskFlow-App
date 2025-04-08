import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { AiOutlineFieldTime } from 'react-icons/ai';
import { MdRefresh } from 'react-icons/md';
import { Tooltip } from '@mui/material';
import effortEstimationService from '../../services/effortEstimationService';

const EffortEstimate = ({ taskId }) => {
  const [estimatedEffort, setEstimatedEffort] = useState(null);
  const [actualEffort, setActualEffort] = useState(null);
  const [loading, setLoading] = useState(false);
  const [task, setTask] = useState(null);
  const { token } = useSelector(state => state.auth);
  
  useEffect(() => {
    fetchTask();
  }, [taskId]);
  
  const fetchTask = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status) {
        const taskData = response.data.task;
        setTask(taskData);
        setActualEffort(taskData.actualEffort);
        
        // If there's no actual effort, generate an estimate
        if (!taskData.actualEffort) {
          // Fetch past tasks to train the model
          const tasksResponse = await axios.get(`${API_BASE_URL}/tasks`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { includeCompleted: true, limit: 100 }
          });
          
          if (tasksResponse.data.status) {
            const pastTasks = tasksResponse.data.tasks;
            
            // Train model with historical data
            effortEstimationService.trainModel(pastTasks);
            
            // Get prediction for current task
            const estimate = effortEstimationService.predictEffort(taskData);
            setEstimatedEffort(estimate);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching task data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateActualEffort = async (value) => {
    try {
      setLoading(true);
      const response = await axios.patch(
        `${API_BASE_URL}/tasks/${taskId}/effort`,
        { actualEffort: value },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status) {
        setActualEffort(value);
        toast.success('Effort updated successfully');
      }
    } catch (error) {
      console.error('Error updating actual effort:', error);
      toast.error('Failed to update effort: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  const regenerateEstimate = () => {
    if (!task) return;
    const estimate = effortEstimationService.predictEffort(task);
    setEstimatedEffort(estimate);
  };
  
  if (!task) return null;
  
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
      <AiOutlineFieldTime className="text-gray-600 text-xl" />
      
      <div className="flex flex-col">
        {actualEffort ? (
          <>
            <span className="text-sm text-gray-600">Actual effort:</span>
            <span className="font-medium">{actualEffort} hours</span>
          </>
        ) : (
          <>
            <span className="text-sm text-gray-600">Estimated effort:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{loading ? '...' : `${estimatedEffort || '?'} hours`}</span>
              <Tooltip title="Regenerate estimate">
                <button 
                  onClick={regenerateEstimate}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <MdRefresh />
                </button>
              </Tooltip>
            </div>
          </>
        )}
      </div>
      
      {!actualEffort && task.stage === 'completed' && (
        <div className="ml-auto">
          <input
            type="number"
            placeholder="Actual hours"
            min="0.5"
            step="0.5"
            className="border border-gray-300 rounded px-2 py-1 w-20 text-sm"
            onChange={(e) => updateActualEffort(parseFloat(e.target.value))}
          />
        </div>
      )}
    </div>
  );
};

export default EffortEstimate;