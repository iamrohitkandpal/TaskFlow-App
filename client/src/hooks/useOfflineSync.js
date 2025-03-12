import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import * as OfflineStorage from '../services/offlineStorage';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

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

  // Function to add an operation to the sync queue
  const addToSyncQueue = useCallback(async (operation) => {
    await OfflineStorage.addToSyncQueue(operation);
  }, []);

  // Process the sync queue when back online
  const syncWithServer = useCallback(async () => {
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
      
      // Remove successfully processed operations from queue
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