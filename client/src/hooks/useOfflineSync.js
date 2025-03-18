import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import * as OfflineStorage from '../services/offlineStorage';

/**
 * Custom hook for handling offline data synchronization
 * Manages queued operations and syncs them when connection is restored
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Set up online/offline event listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Adds an operation to the sync queue for later processing
   * @param {Object} operation - Operation data with type and payload
   */
  const addToSyncQueue = useCallback(async (operation) => {
    await OfflineStorage.addToSyncQueue(operation);
  }, []);

  /**
   * Processes the sync queue when internet connection is restored
   * Synchronizes pending operations with the server
   */
  const syncWithServer = useCallback(async () => {
    // Don't attempt to sync if offline
    if (!isOnline) return;

    setIsSyncing(true);
    setSyncMessage('Synchronizing data with server...');
    
    try {
      const queue = await OfflineStorage.getSyncQueue();
      
      if (queue.length === 0) {
        setSyncMessage('');
        setIsSyncing(false);
        return;
      }
      
      const successIds = [];
      
      // Process each queued operation
      for (const item of queue) {
        try {
          const { operation } = item;
          
          switch (operation.type) {
            case 'CREATE_TASK':
              await axios.post(`${API_BASE_URL}/tasks`, operation.data);
              successIds.push(item.id);
              break;
              
            case 'UPDATE_TASK':
              await axios.put(`${API_BASE_URL}/tasks/${operation.id}`, operation.data);
              successIds.push(item.id);
              break;
              
            case 'DELETE_TASK':
              await axios.delete(`${API_BASE_URL}/tasks/${operation.id}`);
              successIds.push(item.id);
              break;
              
            default:
              console.log('Unknown operation type:', operation.type);
          }
        } catch (error) {
          console.error('Error processing queue item:', error);
        }
      }
      
      // Clean up successfully processed operations
      await OfflineStorage.clearSyncQueue(successIds);
      
      setSyncMessage(`Synchronized ${successIds.length} operations with server`);
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (error) {
      console.error('Error synchronizing:', error);
      setSyncMessage('Sync failed. Will retry automatically.');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline]);

  // Run sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncWithServer();
    }
  }, [isOnline, syncWithServer]);

  return {
    isOnline,
    isSyncing,
    syncMessage,
    addToSyncQueue,
    syncWithServer
  };
};