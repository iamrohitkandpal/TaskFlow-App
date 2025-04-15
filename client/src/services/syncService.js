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

// Improve offline sync with better conflict resolution
const processPendingRequests = async (token) => {
  if (!navigator.onLine) {
    return { processed: 0, failed: 0, conflicts: 0 };
  }
  
  try {
    const pendingRequests = await getOfflinePendingRequests();
    if (!pendingRequests.length) return { processed: 0, failed: 0, conflicts: 0 };

    let processed = 0;
    let failed = 0;
    let conflicts = 0;
    let networkErrors = 0;
    const succeededIds = [];
    const failedRequests = [];
    const conflictRequests = [];
    
    // Group requests by endpoint to handle dependencies
    const groupedRequests = pendingRequests.reduce((groups, request) => {
      const endpoint = request.operation.endpoint;
      if (!groups[endpoint]) groups[endpoint] = [];
      groups[endpoint].push(request);
      return groups;
    }, {});
    
    // Process critical endpoints first (like authentication)
    const priorityOrder = [
      '/users/login',
      '/users/refresh-token',
      '/tasks/create',
      '/tasks'
    ];
    
    // Sort endpoints by priority
    const sortedEndpoints = Object.keys(groupedRequests).sort((a, b) => {
      const indexA = priorityOrder.findIndex(p => a.startsWith(p));
      const indexB = priorityOrder.findIndex(p => b.startsWith(p));
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
    
    // Process requests by priority groups
    for (const endpoint of sortedEndpoints) {
      for (const request of groupedRequests[endpoint]) {
        // Add exponential backoff for retries
        const retryCount = request.retryCount || 0;
        if (retryCount > 3) {
          // Too many retries, mark as failed
          failedRequests.push(request);
          failed++;
          continue;
        }
        
        try {
          // Add timestamp and version tracking
          const requestWithMeta = {
            ...request.operation,
            clientTimestamp: request.timestamp,
            retryCount: retryCount
          };
          
          const response = await axios({
            method: requestWithMeta.method || 'POST',
            url: `${API_BASE_URL}${requestWithMeta.endpoint}`,
            data: requestWithMeta.data,
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Client-Timestamp': request.timestamp,
              'X-Retry-Count': retryCount
            },
            timeout: 15000 // 15 second timeout
          });
          
          if (response.data.conflict) {
            conflicts++;
            conflictRequests.push({
              request,
              serverData: response.data.serverData
            });
          } else {
            processed++;
            succeededIds.push(request.id);
          }
        } catch (error) {
          console.error('Error processing offline request:', error);
          
          // Check if it's a network error vs server error
          if (!error.response) {
            networkErrors++;
            // Increment retry count
            request.retryCount = (request.retryCount || 0) + 1;
            failedRequests.push(request);
          } else if (error.response.status >= 400 && error.response.status < 500) {
            // Client errors - likely won't succeed with retry
            failed++;
            failedRequests.push(request);
          } else {
            // Server errors - might succeed with retry
            request.retryCount = (request.retryCount || 0) + 1;
            failedRequests.push(request);
          }
        }
      }
    }
    
    // Remove successfully processed requests
    if (succeededIds.length) {
      await clearSuccessfulRequests(succeededIds);
    }
    
    // Update failed requests with retry counts
    if (failedRequests.length) {
      await updateFailedRequests(failedRequests);
    }
    
    // Handle conflicts
    if (conflictRequests.length) {
      await storeConflicts(conflictRequests);
    }
    
    return { 
      processed, 
      failed, 
      conflicts,
      networkErrors,
      retriesScheduled: networkErrors > 0
    };
  } catch (error) {
    console.error('Error in processPendingRequests:', error);
    return { 
      processed: 0, 
      failed: 0, 
      conflicts: 0, 
      error: error.message,
      networkError: !error.response
    };
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