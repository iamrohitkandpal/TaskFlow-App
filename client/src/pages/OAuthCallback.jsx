import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const OAuthCallback = () => {
  const { provider } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Completing authentication...');
  const [retryCount, setRetryCount] = useState(0);
  const { token } = useSelector(state => state.auth);

  useEffect(() => {
    // Don't proceed if we don't have a token (not logged in)
    if (!token) {
      setStatus('error');
      setMessage('You must be logged in to connect integrations');
      return;
    }

    const completeAuth = async () => {
      try {
        // Clear previous timeout if any
        if (window.oauthTimeoutId) {
          clearTimeout(window.oauthTimeoutId);
        }
        
        // Set timeout for slow connections
        window.oauthTimeoutId = setTimeout(() => {
          setStatus('timeout');
          setMessage('Connection taking longer than expected. Please wait...');
        }, 10000);
        
        // Extract query parameters from URL
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        const error = queryParams.get('error');
        const state = queryParams.get('state');

        // Check for errors in the callback
        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${queryParams.get('error_description') || error}`);
          clearTimeout(window.oauthTimeoutId);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('Authentication failed: No authorization code received');
          clearTimeout(window.oauthTimeoutId);
          return;
        }

        // Call the backend to complete the OAuth process with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        const response = await axios.post(
          `${API_BASE_URL}/integrations/connect/${provider}/callback`, 
          { code, state },
          { 
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        clearTimeout(window.oauthTimeoutId);
        
        if (response.data.status) {
          setStatus('success');
          setMessage(`Successfully connected to ${provider}`);
          
          // Redirect after a short delay
          setTimeout(() => {
            navigate('/settings/integrations');
          }, 2000);
        } else {
          throw new Error(response.data.message || 'Failed to complete authentication');
        }
      } catch (error) {
        clearTimeout(window.oauthTimeoutId);
        console.error(`Error during ${provider} OAuth callback:`, error);
        
        // Different error handling based on error type
        if (error.name === 'AbortError') {
          setStatus('timeout');
          setMessage(`Connection to ${provider} timed out. You can try again.`);
        } else if (!navigator.onLine) {
          setStatus('offline');
          setMessage('You are offline. Please reconnect and try again.');
        } else if (error.response?.status === 401) {
          setStatus('error');
          setMessage('Your session has expired. Please log in again.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setStatus('error');
          setMessage(`Failed to connect to ${provider}: ${error.response?.data?.message || error.message}`);
        }
      }
    };

    completeAuth();
    
    return () => {
      if (window.oauthTimeoutId) {
        clearTimeout(window.oauthTimeoutId);
      }
    };
  }, [provider, location.search, navigate, token, retryCount]);

  const handleRetry = () => {
    setStatus('processing');
    setMessage(`Retrying connection to ${provider}...`);
    setRetryCount(prev => prev + 1);
  };

  // Render different UI based on status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-semibold mb-4">{provider} Integration</h2>
        
        {/* Status indicators */}
        {status === 'processing' && (
          <div className="flex flex-col items-center">
            <div className="spinner h-12 w-12 mb-4 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
            <p>{message}</p>
          </div>
        )}
        
        {status === 'timeout' && (
          <div className="flex flex-col items-center">
            <div className="bg-yellow-100 text-yellow-800 p-4 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mb-4">{message}</p>
            <button 
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Success and error states */}
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="bg-green-100 text-green-800 p-4 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p>{message}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to integrations page...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="bg-red-100 text-red-800 p-4 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="mb-4">{message}</p>
            <div className="flex space-x-4">
              <button 
                onClick={() => navigate('/settings/integrations')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Back to Integrations
              </button>
              <button 
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;