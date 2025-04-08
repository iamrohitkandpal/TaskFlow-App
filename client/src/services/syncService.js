import { openDB } from 'idb';
import { API_BASE_URL } from '../config/constants';
import axios from 'axios';

// Initialize IndexedDB
const initDB = async () => {
  return openDB('taskflow-db', 1, {
    upgrade(db) {
      // Create object stores
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: '_id' });
        taskStore.createIndex('status', 'status');
        taskStore.createIndex('updatedAt', 'updatedAt');
      }
      
      if (!db.objectStoreNames.contains('pendingRequests')) {
        db.createObjectStore('pendingRequests', {
          keyPath: 'id',
          autoIncrement: true
        });
      }
    }
  });
};

// Save tasks to IndexedDB
export const saveTasks = async (tasks) => {
  const db = await initDB();
  const tx = db.transaction('tasks', 'readwrite');
  const store = tx.objectStore('tasks');
  
  for (const task of tasks) {
    await store.put(task);
  }
  
  await tx.done;
};

// Get tasks from IndexedDB
export const getOfflineTasks = async () => {
  const db = await initDB();
  return db.getAll('tasks');
};

// Save pending API requests
export const savePendingRequest = async (request) => {
  const db = await initDB();
  const tx = db.transaction('pendingRequests', 'readwrite');
  await tx.objectStore('pendingRequests').add({
    url: request.url,
    method: request.method,
    data: request.data,
    timestamp: Date.now()
  });
  await tx.done;
};

// Process pending requests when back online
export const processPendingRequests = async (authToken) => {
  const db = await initDB();
  const tx = db.transaction('pendingRequests', 'readwrite');
  const store = tx.objectStore('pendingRequests');
  const pendingRequests = await store.getAll();
  
  const results = [];
  const successIds = [];
  const conflicts = [];
  
  // Sort by timestamp to process oldest first
  pendingRequests.sort((a, b) => a.timestamp - b.timestamp);
  
  for (const request of pendingRequests) {
    try {
      // For update operations, check for conflicts first
      if (request.method === 'PUT' && request.url.includes('/tasks/')) {
        // Extract task ID from URL
        const taskId = request.url.split('/').pop().split('?')[0];
        
        // Fetch current task state from server
        const currentResponse = await axios.get(`${API_BASE_URL}/tasks/${taskId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const serverTask = currentResponse.data.task;
        
        // Check if there's a conflict (server version is newer)
        if (serverTask.updatedAt > request.data.updatedAt) {
          conflicts.push({
            requestId: request.id,
            clientData: request.data,
            serverData: serverTask
          });
          continue; // Skip this request for now
        }
      }
      
      // Process the request
      const response = await axios({
        url: request.url,
        method: request.method,
        data: request.data,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      successIds.push(request.id);
      results.push({
        success: true,
        requestId: request.id,
        response: response.data
      });
    } catch (error) {
      console.error('Failed to process pending request:', error);
      results.push({
        success: false,
        requestId: request.id,
        error: error.message
      });
    }
  }
  
  // Delete successfully processed requests
  for (const id of successIds) {
    await store.delete(id);
  }
  
  // Return results including any conflicts
  return {
    results,
    conflicts
  };
};

// Use this function when the app comes back online
export const syncDataWithServer = async (authToken) => {
  if (!navigator.onLine) return { success: false, reason: 'offline' };
  
  try {
    // Process any pending requests first
    const pendingResults = await processPendingRequests(authToken);
    
    // Fetch latest data from server
    const response = await axios.get(`${API_BASE_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    // Save fresh data to IndexedDB
    await saveTasks(response.data.tasks);
    
    return { 
      success: true, 
      pendingResults,
      freshData: response.data.tasks 
    };
  } catch (error) {
    console.error('Error during sync:', error);
    return { 
      success: false, 
      reason: 'sync-error',
      error: error.message 
    };
  }
};

// Add conflict resolution handler
export const resolveConflict = async (conflict, resolution) => {
  const db = await initDB();
  const tx = db.transaction('pendingRequests', 'readwrite');
  const store = tx.objectStore('pendingRequests');
  
  // Handle based on resolution type ('local', 'server', or 'merge')
  if (resolution === 'local') {
    // Apply local changes to server
    try {
      await axios({
        url: conflict.clientData.url,
        method: conflict.clientData.method,
        data: conflict.clientData.data,
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'X-Force-Update': 'true'
        }
      });
    } catch (error) {
      console.error('Error applying local changes:', error);
    }
  }
  else if (resolution === 'server') {
    // Accept server version, delete pending request
    await store.delete(conflict.requestId);
  }
  else if (resolution === 'merge') {
    // Create merged version
    const mergedData = {
      ...conflict.serverData,
      ...conflict.clientData.data,
      updatedAt: new Date().toISOString()
    };
    
    try {
      await axios({
        url: conflict.clientData.url,
        method: conflict.clientData.method,
        data: mergedData,
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      await store.delete(conflict.requestId);
    } catch (error) {
      console.error('Error merging changes:', error);
    }
  }
  
  await tx.done;
};