import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGithub } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/constants';

const GitHubIntegration = () => {
  const [connected, setConnected] = useState(false);
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if GitHub is already connected
    const checkConnection = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/integrations/user`);
        const githubIntegration = response.data.find(i => i.provider === 'github');
        
        if (githubIntegration) {
          setConnected(true);
          setRepositories(githubIntegration.repositories || []);
        }
      } catch (err) {
        console.error('Error checking GitHub connection:', err);
        setError('Failed to check connection status');
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/integrations/connect/github`);
      
      // Open GitHub OAuth authorization URL in a new window
      window.open(response.data.authUrl, '_blank');
      
      // Poll for connection status
      const checkInterval = setInterval(async () => {
        const statusResponse = await axios.get(`${API_BASE_URL}/integrations/user`);
        const githubIntegration = statusResponse.data.find(i => i.provider === 'github');
        
        if (githubIntegration) {
          setConnected(true);
          setRepositories(githubIntegration.repositories || []);
          clearInterval(checkInterval);
          setLoading(false);
        }
      }, 5000);
      
      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        setLoading(false);
      }, 120000);
      
    } catch (err) {
      console.error('Error connecting to GitHub:', err);
      setError('Failed to connect to GitHub');
      setLoading(false);
    }
  };

  const refreshRepositories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/integrations/user`);
      const githubIntegration = response.data.find(i => i.provider === 'github');
      
      if (githubIntegration) {
        const refreshResponse = await axios.get(`${API_BASE_URL}/integrations/refresh/${githubIntegration._id}`);
        setRepositories(refreshResponse.data.repositories || []);
      }
    } catch (err) {
      console.error('Error refreshing repositories:', err);
      setError('Failed to refresh repositories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FaGithub className="text-2xl mr-2" />
          <h3 className="text-lg font-medium">GitHub Integration</h3>
        </div>
        
        {!connected ? (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-700 flex items-center"
          >
            {loading ? 'Connecting...' : 'Connect GitHub'}
          </button>
        ) : (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            Connected
          </span>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
          {error}
        </div>
      )}
      
      {connected && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium">Linked Repositories</h4>
            <button 
              onClick={refreshRepositories}
              className="text-sm text-blue-600 hover:underline"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          {repositories.length > 0 ? (
            <ul className="divide-y">
              {repositories.map(repo => (
                <li key={repo.id} className="py-2">
                  <a 
                    href={repo.htmlUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {repo.fullName}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No repositories found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GitHubIntegration;