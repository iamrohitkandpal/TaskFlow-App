import { io } from "../index.js";
import Activity from "../models/activity.model.js";

/**
 * Records task activity in the database and broadcasts updates to relevant users
 * @param {Object} socket - Socket.io socket instance
 * @param {Object} data - Task update data including action, task, userId
 */
export const handleTaskUpdate = async (socket, data) => {
  try {
    const { action, task, userId, taskId } = data;
    
    // Log activity to database for history tracking
    if (userId) {
      await Activity.create({
        user: userId,
        action,
        taskId: task?._id || taskId,
        details: task || { taskId },
      });
    }
    
    // Targeted notifications to task assignees
    if (task?.assignees) {
      task.assignees.forEach(assignee => {
        socket.to(assignee.toString()).emit("taskUpdated", data);
      });
    }
    
    // Project-wide notification for all team members
    if (task?.projectId) {
      socket.to(`project-${task.projectId}`).emit("taskUpdated", data);
    }
    
    // Broadcast to all users (for global views)
    socket.broadcast.emit("taskUpdated", data);
  } catch (error) {
    console.error("Error handling task update:", error);
  }
};

/**
 * Retrieves recent activity logs from the database
 * @param {Number} limit - Maximum number of activities to return
 * @returns {Array} Recent activities with user and task details
 */
export const getActivities = async (limit = 10) => {
  try {
    const activities = await Activity.find()
      .populate("user", "name email avatar")
      .populate("taskId", "title")
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return activities;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};

// Add these functions to your socket.io setup

// Track active collaborative sessions
const collaborativeSessions = new Map(); // taskId -> Set of user objects

// Handle collaborative editing
const setupCollaborativeEditing = (io, socket) => {
  // Join collaborative session
  socket.on('join-collaborative-session', ({ taskId, userId, userName }) => {
    if (!taskId || !userId) return;
    
    // Create room name for this task's collaborative session
    const roomName = `task-collab-${taskId}`;
    
    // Join the room
    socket.join(roomName);
    
    // Add user to collaborators list
    if (!collaborativeSessions.has(taskId)) {
      collaborativeSessions.set(taskId, new Set());
    }
    
    // Store user info
    const userInfo = { 
      userId,
      name: userName || 'Anonymous User',
      socketId: socket.id
    };
    
    collaborativeSessions.get(taskId).add(userInfo);
    
    // Broadcast updated collaborators list
    io.to(roomName).emit('collaborator-update', {
      collaborators: Array.from(collaborativeSessions.get(taskId))
    });
    
    console.log(`User ${userId} joined collaborative session for task ${taskId}`);
  });
  
  // Leave collaborative session
  socket.on('leave-collaborative-session', ({ taskId, userId }) => {
    if (!taskId || !userId) return;
    
    const roomName = `task-collab-${taskId}`;
    
    // Remove from room
    socket.leave(roomName);
    
    // Remove from collaborators list
    if (collaborativeSessions.has(taskId)) {
      const collaborators = collaborativeSessions.get(taskId);
      
      // Find and remove the user
      for (const collaborator of collaborators) {
        if (collaborator.userId === userId || collaborator.socketId === socket.id) {
          collaborators.delete(collaborator);
          break;
        }
      }
      
      // If this was the last collaborator, remove the session
      if (collaborators.size === 0) {
        collaborativeSessions.delete(taskId);
      } else {
        // Broadcast updated collaborators list
        io.to(roomName).emit('collaborator-update', {
          collaborators: Array.from(collaborators)
        });
      }
    }
    
    console.log(`User ${userId} left collaborative session for task ${taskId}`);
  });
  
  // Handle content updates
  socket.on('content-update', ({ taskId, content, userId }) => {
    if (!taskId || !userId) return;
    
    const roomName = `task-collab-${taskId}`;
    
    // Broadcast the content update to all clients in the room except sender
    socket.to(roomName).emit('content-update', {
      taskId,
      content,
      userId
    });
  });
  
  // Clean up on disconnect
  socket.on('disconnect', () => {
    // Find any collaborative sessions this user was part of
    for (const [taskId, collaborators] of collaborativeSessions.entries()) {
      let userRemoved = false;
      
      // Find and remove the user by socket ID
      for (const collaborator of collaborators) {
        if (collaborator.socketId === socket.id) {
          collaborators.delete(collaborator);
          userRemoved = true;
          break;
        }
      }
      
      // If a user was removed, update the room
      if (userRemoved) {
        const roomName = `task-collab-${taskId}`;
        
        // If this was the last collaborator, remove the session
        if (collaborators.size === 0) {
          collaborativeSessions.delete(taskId);
        } else {
          // Broadcast updated collaborators list
          io.to(roomName).emit('collaborator-update', {
            collaborators: Array.from(collaborators)
          });
        }
      }
    }
  });
};

// Make sure to add this function to your socket initialization
// In your main socket setup function, add:
// setupCollaborativeEditing(io, socket);