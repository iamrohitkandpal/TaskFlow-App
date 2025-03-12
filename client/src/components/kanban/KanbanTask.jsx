import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, Typography, Box, Chip, Avatar } from '@mui/material';
import { format } from 'date-fns';

const KanbanTask = ({ task, index }) => {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 2,
            backgroundColor: snapshot.isDragging ? 'rgba(63, 81, 181, 0.1)' : 'white',
            boxShadow: snapshot.isDragging ? 3 : 1,
          }}
        >
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              {task.title}
            </Typography>

            {task.dueDate && (
              <Typography variant="caption" color="textSecondary" component="p">
                Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </Typography>
            )}

            <Box sx={{ display: 'flex', mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
              {task.priority && (
                <Chip
                  label={task.priority}
                  size="small"
                  color={
                    task.priority === 'high'
                      ? 'error'
                      : task.priority === 'medium'
                      ? 'warning'
                      : 'info'
                  }
                  variant="outlined"
                />
              )}
              
              {task.tag && (
                <Chip 
                  label={task.tag} 
                  size="small" 
                  variant="outlined" 
                />
              )}
            </Box>

            {task.assignee && task.assignee.name && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Avatar
                  sx={{ width: 24, height: 24, mr: 1 }}
                  alt={task.assignee.name}
                  src={task.assignee.avatar || ''}
                />
                <Typography variant="caption">
                  {task.assignee.name}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
};

export default KanbanTask;