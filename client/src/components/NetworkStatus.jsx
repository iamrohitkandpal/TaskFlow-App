import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasSlowConnection, setHasSlowConnection] = useState(false);
  
  // Check connection quality
  const checkConnectionQuality = useCallback(async () => {
    if (!navigator.onLine) return;
    
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch('/health', { 
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      // If latency is high, consider connection slow
      setHasSlowConnection(latency > 2000);
    } catch (error) {
      console.log('Connection check failed:', error);
      setHasSlowConnection(true);
    }
  }, []);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('You are back online!');
      checkConnectionQuality();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Some features may be unavailable.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial state
    checkConnectionQuality();
    
    // Set up periodic checks
    const intervalId = setInterval(checkConnectionQuality, 30000); // Every 30 seconds
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [checkConnectionQuality]);
  
  if (isOnline && !hasSlowConnection) return null;
  
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center ${
      !isOnline ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white'
    }`}>
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
          !isOnline 
            ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"  // Error icon
            : "M12 9v2m0 4h.01M12 5a7 7 0 110 14 7 7 0 010-14z"    // Warning icon
        } />
      </svg>
      {!isOnline 
        ? 'You are offline. Some features may be unavailable.' 
        : 'Slow connection detected. Some operations may be delayed.'}
    </div>
  );
};

export default NetworkStatus;