import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, Badge } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SignalWifiStatusbar4BarIcon from '@mui/icons-material/SignalWifiStatusbar4Bar';

const OfflineStatusIndicator = () => {
  const [online, setOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShowReconnected(true);
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCloseSnackbar = () => {
    setShowReconnected(false);
  };

  return (
    <>
      {!online && (
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          zIndex: 1500 
        }}>
          <Badge
            color="error"
            variant="dot"
            overlap="circular"
            badgeContent=" "
          >
            <WifiOffIcon 
              color="action" 
              style={{ 
                backgroundColor: 'white', 
                padding: '8px', 
                borderRadius: '50%',
                boxShadow: '0 3px 5px rgba(0,0,0,0.22)'
              }} 
            />
          </Badge>
        </div>
      )}

      <Snackbar
        open={showReconnected}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          sx={{ width: '100%', display: 'flex', alignItems: 'center' }}
          icon={<SignalWifiStatusbar4BarIcon />}
        >
          You're back online! Syncing your data...
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineStatusIndicator;