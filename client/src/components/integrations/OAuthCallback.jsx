import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';

const OAuthCallback = () => {
  const { provider } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Completing authentication...');

  useEffect(() => {
    const completeAuth = async () => {
      try {
        // Extract query parameters from URL
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');
        const state = queryParams.get('state');

        if (!code) {
          setStatus('error');
          setMessage('Authentication failed: No authorization code received');
          return;
        }

        // Call the backend to complete the OAuth process
        const response = await axios.post(`${API_BASE_URL}/integrations/connect/${provider}/callback`, {
          code,
          state
        });

        setStatus('success');
        setMessage(`Successfully connected to ${provider}`);

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/settings/integrations');
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || `Failed to complete ${provider} authentication`);
      }
    };

    completeAuth();
  }, [provider, location.search, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          {status === 'processing' && (
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          )}
          
          {status === 'success' && (
            <div className="bg-green-100 text-green-800 p-4 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-100 text-red-800 p-4 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          
          <h2 className="text-xl font-semibold mb-2 capitalize">{provider} Integration</h2>
          <p className="text-gray-600">{message}</p>
          
          {status === 'error' && (
            <button
              onClick={() => navigate('/settings/integrations')}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Back to Integrations
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;