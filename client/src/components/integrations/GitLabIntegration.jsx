import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaGitlab } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/constants';

const GitLabIntegration = () => {
  const [connected, setConnected] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if GitLab is already connected
    const checkConnection = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/integrations/user`);
        const gitlabIntegration = response.data.find(i => i.provider === 'gitlab');
        
        if (gitlabIntegration) {
          setConnected(true);
          setProjects(gitlabIntegration.repositories || []);
        }
      } catch (err) {
        console.error('Error checking GitLab connection:', err);
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
      const response = await axios.post(`${API_BASE_URL}/integrations/connect/gitlab`);
      
      // Open GitLab OAuth authorization URL in a new window
      window.open(response.data.authUrl, '_blank');
      
      // Poll for connection status
      const checkInterval = setInterval(async () => {
        const statusResponse = await axios.get(`${API_BASE_URL}/integrations/user`);
        const gitlabIntegration = statusResponse.data.find(i => i.provider === 'gitlab');
        
        if (gitlabIntegration) {
          setConnected(true);
          setProjects(gitlabIntegration.repositories || []);
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
      console.error('Error connecting to GitLab:', err);
      setError('Failed to connect to GitLab');
      setLoading(false);
    }
  };

  const refreshProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/integrations/user`);
      const gitlabIntegration = response.data.find(i => i.provider === 'gitlab');
      
      if (gitlabIntegration) {
        const refreshResponse = await axios.get(`${API_BASE_URL}/integrations/refresh/${gitlabIntegration._id}`);
        setProjects(refreshResponse.data.repositories || []);
      }
    } catch (err) {
      console.error('Error refreshing projects:', err);
      setError('Failed to refresh projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FaGitlab className="text-2xl mr-2 text-orange-600" />
          <h3 className="text-lg font-medium">GitLab Integration</h3>
        </div>
        
        {!connected ? (
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 flex items-center"
          >
            {loading ? 'Connecting...' : 'Connect GitLab'}
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
            <h4 className="font-medium">Linked Projects</h4>
            <button 
              onClick={refreshProjects}
              className="text-sm text-blue-600 hover:underline"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          
          {projects.length > 0 ? (
            <ul className="divide-y">
              {projects.map(project => (
                <li key={project.id} className="py-2">
                  <a 
                    href={project.htmlUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {project.fullName || project.name}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No projects found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GitLabIntegration;