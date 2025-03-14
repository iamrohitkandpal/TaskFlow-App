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
  
  for (const request of pendingRequests) {
    try {
      const response = await axios({
        url: request.url,
        method: request.method,
        data: request.data,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      results.push({
        success: true,
        requestId: request.id,
        response: response.data
      });
      
      await store.delete(request.id);
    } catch (error) {
      console.error('Failed to process pending request:', error);
      results.push({
        success: false,
        requestId: request.id,
        error: error.message
      });
      
      // If the error is not due to network issues, remove the failed request
      if (error.response) {
        await store.delete(request.id);
      }
    }
  }
  
  await tx.done;
  return results;
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