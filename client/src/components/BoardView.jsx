import React from 'react'
import TaskCard from './TaskCard'

const BoardView = ({tasks}) => {
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // No change or dropped outside valid area
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Extract the new status from the destination droppableId
    const newStatus = destination.droppableId.split('-')[1];
    const originalStatus = source.droppableId.split('-')[1];
    
    // Find the task that was moved
    const taskToUpdate = tasks.find(t => t._id === draggableId);
    if (!taskToUpdate) return;
    
    // Keep a copy of the original task state for rollback
    const originalTask = { ...taskToUpdate };
    
    // Start a request timeout tracker
    let requestTimeoutId;
    
    try {
      // Set timeout warning for slow network
      requestTimeoutId = setTimeout(() => {
        toast.info('Network is slow. Your changes are still being saved...');
      }, 3000);
      
      // Optimistic update
      setTasks(tasks.map(task => 
        task._id === draggableId 
          ? { ...task, stage: newStatus } 
          : task
      ));
      
      // If moving to in-progress, check WIP limit first
      if (newStatus === 'in-progress' && originalStatus !== 'in-progress') {
        const wipResponse = await axios.get(
          `${API_BASE_URL}/tasks/user/${user._id}/wip-limit`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000 // 5 second timeout for WIP check
          }
        );
        
        if (wipResponse.data.isLimitExceeded) {
          // Revert the optimistic update
          setTasks(tasks.map(task => 
            task._id === draggableId 
              ? { ...task, stage: originalStatus } 
              : task
          ));
          
          toast.error(`Work-in-progress limit reached (${wipResponse.data.limit} tasks). Please complete existing tasks first.`);
          clearTimeout(requestTimeoutId);
          return;
        }
      }
      
      // Send the update with a versioning field to detect conflicts
      const response = await updateTaskStatus({ 
        id: draggableId, 
        status: newStatus,
        lastKnownVersion: taskToUpdate.updatedAt
      }).unwrap();
      
      // Clear the timeout warning
      clearTimeout(requestTimeoutId);
      
      // Check for version conflicts
      if (response.conflict) {
        toast.warning('Task was updated by someone else. The latest status is shown.');
        // Refresh the board to get the latest state
        refetchTasks();
      } else {
        toast.success(`Task moved to ${newStatus.replace('-', ' ')}`);
      }
      
    } catch (err) {
      console.error('Error updating task status:', err);
      clearTimeout(requestTimeoutId);
      
      // Rollback the optimistic update
      setTasks(tasks.map(task => 
        task._id === draggableId 
          ? { ...originalTask } 
          : task
      ));
      
      // Show appropriate error based on error type
      if (!navigator.onLine) {
        toast.error('You are offline. Changes will sync when you reconnect.');
        // Queue the update for later when back online
        await savePendingRequest({
          method: 'PATCH',
          endpoint: `/tasks/${draggableId}/status`,
          data: { status: newStatus }
        });
      } else if (err.status === 409) {
        toast.error('Status update conflict. Please try again.');
      } else {
        toast.error('Failed to update task. Please try again.');
      }
    }
  };

  return (
    <div className='w-full py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 2xl:gap-10'>
      {
        tasks?.map((task, index) => (
          <TaskCard task={task} key={index} />
        ))
      }
    </div>
  )
}

export default BoardView