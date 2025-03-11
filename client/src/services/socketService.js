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

export default socket;