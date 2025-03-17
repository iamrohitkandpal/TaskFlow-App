import { io } from "socket.io-client";
import store from "../redux/store";
import { addTask, updateTask, deleteTask } from "../redux/slices/taskSlice";
import { addActivity } from "../redux/slices/activitySlice"; // You'll need to create this slice

// Create socket instance
const socket = io(import.meta.env.VITE_BASE_URL, {
  withCredentials: true,
  autoConnect: false,
});

// Initialize socket connection
export const initializeSocket = (userId) => {
  if (!socket.connected) {
    socket.connect();
    
    // Join user-specific room
    if (userId) {
      socket.emit("join", userId);
    }

    // Listen for task updates
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

// Join a project room to receive project-specific updates
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