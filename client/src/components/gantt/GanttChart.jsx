import React, { useEffect, useRef, useState } from 'react';
import Gantt from 'frappe-gantt';
import moment from 'moment';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { useSelector } from 'react-redux';

const GanttChart = ({ projectId }) => {
  const ganttContainer = useRef(null);
  const ganttInstance = useRef(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('Day');
  
  const { token } = useSelector(state => state.auth);
  
  useEffect(() => {
    fetchTasks();
  }, [projectId]);
  
  useEffect(() => {
    if (tasks.length > 0) {
      renderGantt();
    }
  }, [tasks, viewMode]);
  
  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { includeDependencies: true }
      });
      
      if (response.data.status) {
        const formattedTasks = formatTasksForGantt(response.data.tasks);
        setTasks(formattedTasks);
      } else {
        setError('Failed to load tasks');
      }
    } catch (err) {
      console.error('Error fetching tasks for Gantt chart:', err);
      setError('An error occurred while loading the timeline');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatTasksForGantt = (tasks) => {
    return tasks.map(task => ({
      id: task._id,
      name: task.title,
      start: task.startDate || task.createdAt,
      end: task.dueDate || moment(task.createdAt).add(1, 'days').toDate(),
      progress: task.progress || (task.status === 'completed' ? 100 : 0),
      dependencies: task.dependencies?.map(dep => dep._id || dep).join(',') || null,
      custom_class: getCriticalPathClass(task)
    }));
  };
  
  // Function to determine if a task is on the critical path
  // This is a simplified implementation - in a real project, you'd need a more complex algorithm
  const getCriticalPathClass = (task) => {
    if (task.isOnCriticalPath) return 'critical-path';
    if (task.status === 'completed') return 'completed-task';
    if (task.priority === 'high') return 'high-priority-task';
    return '';
  };
  
  const renderGantt = () => {
    if (ganttInstance.current) {
      ganttInstance.current.refresh(tasks);
      return;
    }
    
    if (ganttContainer.current && tasks.length > 0) {
      ganttInstance.current = new Gantt(ganttContainer.current, tasks, {
        header_height: 50,
        column_width: 30,
        step: 24,
        view_modes: ['Quarter Day', 'Half Day', 'Day', 'Week', 'Month'],
        bar_height: 20,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        view_mode: viewMode,
        date_format: 'YYYY-MM-DD',
        custom_popup_html: task => {
          return `
            <div class="p-3 bg-white shadow rounded-lg">
              <h3 class="font-bold text-gray-800">${task.name}</h3>
              <div class="text-sm text-gray-600 mt-1">
                <p>Start: ${moment(task.start).format('MMM D, YYYY')}</p>
                <p>End: ${moment(task.end).format('MMM D, YYYY')}</p>
                <p>Progress: ${task.progress}%</p>
              </div>
            </div>
          `;
        },
        on_click: task => {
          // Navigate to task details or open a modal
          window.location.href = `/tasks/${task.id}`;
        },
        on_date_change: (task, start, end) => {
          updateTaskDates(task.id, start, end);
        }
      });
    }
  };
  
  const updateTaskDates = async (taskId, start, end) => {
    try {
      await axios.put(`${API_BASE_URL}/tasks/${taskId}/dates`, {
        startDate: start,
        dueDate: end
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, start, end } 
            : task
        )
      );
    } catch (err) {
      console.error('Error updating task dates:', err);
      // Refresh tasks to revert changes if the update failed
      fetchTasks();
    }
  };
  
  const handleViewModeChange = (newMode) => {
    setViewMode(newMode);
    if (ganttInstance.current) {
      ganttInstance.current.change_view_mode(newMode);
    }
  };
  
  if (isLoading) return <div className="p-4 text-center">Loading timeline...</div>;
  
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  
  if (tasks.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">No tasks available for timeline view</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap justify-between items-center">
          <h2 className="text-xl font-semibold">Project Timeline</h2>
          
          <div className="flex space-x-2 mt-2 sm:mt-0">
            <button 
              onClick={() => handleViewModeChange('Day')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'Day' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Day
            </button>
            <button 
              onClick={() => handleViewModeChange('Week')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'Week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Week
            </button>
            <button 
              onClick={() => handleViewModeChange('Month')}
              className={`px-3 py-1 rounded text-sm ${viewMode === 'Month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Month
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4 overflow-x-auto">
        <div className="gantt-chart-legend flex space-x-6 mb-4 text-sm">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-sm mr-1"></span>
            <span>Regular Task</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-sm mr-1"></span>
            <span>Completed</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-sm mr-1"></span>
            <span>Critical Path</span>
          </div>
        </div>
        
        <div 
          ref={ganttContainer} 
          className="gantt-container" 
          style={{ height: `${Math.max(tasks.length * 35, 300)}px` }}
        ></div>
      </div>
    </div>
  );
};

export default GanttChart;