import React from 'react';
import { useEstimateTaskEffortQuery } from '../../redux/slices/api/aiApiSlice';

const EffortEstimate = ({ taskId }) => {
  const { data, error, isLoading } = useEstimateTaskEffortQuery(taskId, {
    // Skip query if taskId is not provided
    skip: !taskId
  });
  
  if (isLoading) {
    return <span className="text-xs text-gray-500">Calculating estimate...</span>;
  }
  
  if (error) {
    return <span className="text-xs text-red-500">Estimation failed</span>;
  }
  
  if (!data || !data.effortDays) {
    return null;
  }
  
  // Determine effort level for display
  let effortLabel = 'Medium';
  let effortColor = 'text-yellow-600';
  
  if (data.effortDays <= 2) {
    effortLabel = 'Quick';
    effortColor = 'text-green-600';
  } else if (data.effortDays > 5) {
    effortLabel = 'Substantial';
    effortColor = 'text-red-600';
  }
  
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-600">Estimated effort:</span>
      <span className={`text-xs font-medium ${effortColor}`}>
        {effortLabel} ({data.effortDays} day{data.effortDays !== 1 ? 's' : ''})
      </span>
    </div>
  );
};

export default EffortEstimate;