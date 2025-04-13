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

// Improve the processPendingRequests function
const processPendingRequests = async (token) => {
  if (!navigator.onLine) {
    return { processed: 0, failed: 0, conflicts: 0 };
  }
  
  try {
    const pendingRequests = await OfflineStorage.getSyncQueue();
    if (!pendingRequests.length) return { processed: 0, failed: 0, conflicts: 0 };

    let processed = 0;
    let failed = 0;
    let conflicts = 0;
    const succeededIds = [];
    
    for (const request of pendingRequests) {
      try {
        // Add timestamp to check for conflicts
        const requestWithTimestamp = {
          ...request.operation,
          clientTimestamp: request.timestamp
        };
        
        const response = await axios({
          method: requestWithTimestamp.method || 'POST',
          url: `${API_BASE_URL}${requestWithTimestamp.endpoint}`,
          data: requestWithTimestamp.data,
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Client-Timestamp': request.timestamp
          }
        });
        
        if (response.data.conflict) {
          conflicts++;
          // Store conflict data for resolution
          await OfflineStorage.addConflict({
            id: request.id,
            serverData: response.data.serverData,
            clientData: requestWithTimestamp.data,
            timestamp: Date.now()
          });
        } else {
          processed++;
          succeededIds.push(request.id);
        }
      } catch (error) {
        console.error('Error processing offline request:', error);
        failed++;
      }
    }
    
    // Remove successfully processed requests
    if (succeededIds.length) {
      await OfflineStorage.clearSyncQueue(succeededIds);
    }
    
    return { processed, failed, conflicts };
  } catch (error) {
    console.error('Error in processPendingRequests:', error);
    return { processed: 0, failed: 0, conflicts: 0, error: error.message };
  }
};

// Use this function when the app comes back online
export const syncDataWithServer = async (authToken) => {
  // Check internet connectivity
  if (!navigator.onLine) {
    console.log('Device is offline, skipping sync');
    return { success: false, reason: 'offline' };
  }
  
  try {
    // Try a quick connectivity check before starting full sync
    await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    
    // Process any pending requests first
    const pendingResults = await processPendingRequests(authToken);
    
    // Fetch latest data from server
    const response = await axios.get(`${API_BASE_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      timeout: 10000 // 10 second timeout for this specific request
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
    
    // Differentiate between types of errors
    if (!navigator.onLine) {
      return { success: false, reason: 'offline' };
    }
    
    if (error.code === 'ECONNABORTED') {
      return { success: false, reason: 'timeout', error: 'Server request timed out' };
    }
    
    return { 
      success: false, 
      reason: error.response?.status === 401 ? 'auth-error' : 'sync-error',
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