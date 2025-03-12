import React, { useState } from 'react';
import { useSyncTaskToCalendarMutation, useGetUserCalendarsQuery } from '../../redux/slices/api/calendarApiSlice';
import { toast } from 'sonner';
import { FaCalendarAlt, FaCheck } from 'react-icons/fa';

const CalendarSync = ({ taskId, dueDate, calendarSync }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data, isLoading } = useGetUserCalendarsQuery();
  const [syncTask, { isLoading: isSyncing }] = useSyncTaskToCalendarMutation();
  
  if (!dueDate || isLoading) {
    return null;
  }
  
  const hasCalendars = data?.status && data?.calendars?.length > 0;
  const isSynced = calendarSync?.synced;
  
  if (!hasCalendars) {
    return null;
  }
  
  const handleSync = async (calendarId) => {
    try {
      const result = await syncTask({
        taskId,
        calendarId
      }).unwrap();
      
      if (result.status) {
        toast.success('Task synced to calendar successfully');
        setIsOpen(false);
      } else {
        toast.error(result.message || 'Failed to sync task');
      }
    } catch (error) {
      console.error('Calendar sync error:', error);
      toast.error(error.data?.message || 'Failed to sync task to calendar');
    }
  };
  
  return (
    <div className="relative">
      {isSynced ? (
        <div className="flex items-center text-sm text-green-600">
          <FaCheck className="mr-1" /> 
          <span>Synced to calendar</span>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <FaCalendarAlt className="mr-1" />
          <span>Sync to calendar</span>
        </button>
      )}
      
      {isOpen && !isSynced && (
        <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <div className="px-3 py-2 text-xs font-medium text-gray-500">
              Select calendar:
            </div>
            {data.calendars.map((calendar) => (
              <button
                key={calendar.id}
                onClick={() => handleSync(calendar.id)}
                disabled={isSyncing}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                {calendar.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarSync;