import { io } from "socket.io-client";
import store from "../redux/store";
import { addTask, updateTask, deleteTask } from "../redux/slices/taskSlice";
import { addActivity } from "../redux/slices/activitySlice";

// Create socket instance with credentials support
const socket = io(import.meta.env.VITE_BASE_URL, {
  withCredentials: true,
  autoConnect: false,
});

/**
 * Initializes the Socket.io connection and sets up event listeners
 * @param {string} userId - Current user ID for room subscription
 */
export const initializeSocket = (userId) => {
  if (!socket.connected) {
    socket.connect();
    
    // Join user-specific room for targeted notifications
    if (userId) {
      socket.emit("join", userId);
    }

    // Listen for real-time task updates from other users
    socket.on("taskUpdated", (data) => {
      console.log("Received task update:", data);
      
      // Update Redux store based on the action type
      switch (data.action) {
        case "create":
          store.dispatch(addTask(data.task));
          store.dispatch(addActivity({
            type: 'create',
            user: data.userId,
            task: data.task,
            timestamp: new Date()
          }));
          break;
        case "update":
          store.dispatch(updateTask(data.task));
          store.dispatch(addActivity({
            type: 'update',
            user: data.userId,
            task: data.task,
            timestamp: new Date()
          }));
          break;
        case "delete":
          store.dispatch(deleteTask(data.taskId));
          store.dispatch(addActivity({
            type: 'delete',
            user: data.userId,
            taskId: data.taskId,
            timestamp: new Date()
          }));
          break;
        default:
          break;
      }
    });
  }
};

/**
 * Joins a project-specific room to receive project updates
 * @param {string} projectId - Project ID to subscribe to
 */
export const joinProjectRoom = (projectId) => {
  if (socket.connected && projectId) {
    socket.emit("joinProject", projectId);
  }
};

// Emit task update event with enhanced data
export const emitTaskUpdate = (action, data) => {
  if (socket.connected) {
    const userId = store.getState().auth?.user?._id;
    socket.emit("taskUpdate", { action, ...data, userId });
  }
};

// Disconnect socket
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Join a collaborative editing session
export const joinCollaborativeSession = (taskId, userId) => {
  if (!socket) return;
  
  socket.emit('join-collaborative-session', {
    taskId,
    userId
  });
};

// Leave a collaborative editing session
export const leaveCollaborativeSession = (taskId, userId) => {
  if (!socket) return;
  
  socket.emit('leave-collaborative-session', {
    taskId,
    userId
  });
};

// Send a content update to collaborators
export const sendContentUpdate = (taskId, content, userId) => {
  if (!socket) return;
  
  socket.emit('content-update', {
    taskId,
    content,
    userId
  });
};

// Listen for content updates from other collaborators
export const onContentUpdate = (callback) => {
  if (!socket) return;
  
  socket.on('content-update', (data) => {
    callback(data);
  });
};

// Listen for collaborator changes (joining/leaving)
export const onCollaboratorUpdate = (callback) => {
  if (!socket) return;
  
  socket.on('collaborator-update', (data) => {
    callback(data);
  });
};

// Clean up listeners
export const removeCollaborationListeners = () => {
  if (!socket) return;
  
  socket.off('content-update');
  socket.off('collaborator-update');
};

export default socket;