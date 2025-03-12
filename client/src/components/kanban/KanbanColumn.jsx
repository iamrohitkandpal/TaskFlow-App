import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Paper, Typography, Box, Divider, Tooltip } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import KanbanTask from './KanbanTask';

// Define WIP limits for different columns
const WIP_LIMITS = {
  'todo': 0, // No limit for todo
  'in-progress': 3, // Maximum 3 tasks in progress
  'review': 2, // Maximum 2 tasks in review
  'completed': 0 // No limit for completed
};

const KanbanColumn = ({ column, tasks, category }) => {
  const columnTasks = tasks.filter(
    task => task.stage === column && (task.category || 'Uncategorized') === category
  );
  
  // Check if WIP limit is exceeded
  const wipLimit = WIP_LIMITS[column];
  const isWipLimitExceeded = wipLimit > 0 && columnTasks.length > wipLimit;
  
  let title;
  switch (column) {
    case 'todo':
      title = 'To Do';
      break;
    case 'in-progress':
      title = 'In Progress';
      break;
    case 'review':
      title = 'Review';
      break;
    case 'completed':
      title = 'Completed';
      break;
    default:
      title = column;
  }

  return (
    <Droppable 
      droppableId={`column-${column}-${category}`}
      // Disable dropping if WIP limit is exceeded
      isDropDisabled={isWipLimitExceeded}
    >
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.droppableProps}
          sx={{
            p: 2,
            minHeight: '200px',
            backgroundColor: theme => {
              if (isWipLimitExceeded) {
                return theme.palette.warning.light; // Highlight exceeded columns
              }
              return column === 'completed'
                ? theme.palette.success.light
                : theme.palette.background.default;
            },
            borderTop: isWipLimitExceeded ? '2px solid #f44336' : 'none',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1">
              {title} ({columnTasks.length})
            </Typography>
            
            {wipLimit > 0 && (
              <Tooltip title={`WIP Limit: ${wipLimit}`}>
                <Typography variant="caption" sx={{ 
                  color: isWipLimitExceeded ? 'error.main' : 'text.secondary',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {isWipLimitExceeded && <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />}
                  {columnTasks.length}/{wipLimit}
                </Typography>
              </Tooltip>
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {columnTasks.map((task, index) => (
            <KanbanTask key={task._id} task={task} index={index} />
          ))}

          {provided.placeholder}
        </Paper>
      )}
    </Droppable>
  );
};

export default KanbanColumn;