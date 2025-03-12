import { openDB } from 'idb';

const DB_NAME = 'taskflow-offline-db';
const DB_VERSION = 1;
const STORES = {
  TASKS: 'tasks',
  SYNC_QUEUE: 'syncQueue',
  USER_DATA: 'userData'
};

// Initialize the IndexedDB database
const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.TASKS)) {
        const taskStore = db.createObjectStore(STORES.TASKS, { keyPath: '_id' });
        taskStore.createIndex('projectId', 'projectId', { unique: false });
        taskStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        db.createObjectStore(STORES.SYNC_QUEUE, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
      }
      
      if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
        db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
      }
    }
  });
};

// Task operations
export const saveTasks = async (tasks) => {
  const db = await initDB();
  const tx = db.transaction(STORES.TASKS, 'readwrite');
  
  for (const task of tasks) {
    await tx.store.put(task);
  }
  
  await tx.done;
};

export const getTasksByProject = async (projectId) => {
  const db = await initDB();
  return db.getAllFromIndex(STORES.TASKS, 'projectId', projectId);
};

export const getTaskById = async (taskId) => {
  const db = await initDB();
  return db.get(STORES.TASKS, taskId);
};

export const deleteTask = async (taskId) => {
  const db = await initDB();
  await db.delete(STORES.TASKS, taskId);
};

// Sync queue operations
export const addToSyncQueue = async (operation) => {
  const db = await initDB();
  await db.add(STORES.SYNC_QUEUE, {
    operation,
    timestamp: Date.now()
  });
};

export const getSyncQueue = async () => {
  const db = await initDB();
  return db.getAll(STORES.SYNC_QUEUE);
};

export const clearSyncQueue = async (ids) => {
  const db = await initDB();
  const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
  
  for (const id of ids) {
    await tx.store.delete(id);
  }
  
  await tx.done;
};

// User data operations
export const saveUserData = async (key, data) => {
  const db = await initDB();
  await db.put(STORES.USER_DATA, { key, data });
};

export const getUserData = async (key) => {
  const db = await initDB();
  const result = await db.get(STORES.USER_DATA, key);
  return result ? result.data : null;
};

// Clear all data (for logout)
export const clearAllData = async () => {
  const db = await initDB();
  const tx = db.transaction([STORES.TASKS, STORES.SYNC_QUEUE, STORES.USER_DATA], 'readwrite');
  
  await Promise.all([
    tx.objectStore(STORES.TASKS).clear(),
    tx.objectStore(STORES.SYNC_QUEUE).clear(),
    tx.objectStore(STORES.USER_DATA).clear()
  ]);
  
  await tx.done;
};