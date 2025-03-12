import React, { useState } from 'react';
import { 
  useConnectToGitHubMutation, 
  useConnectToGitLabMutation, 
  useGetUserIntegrationsQuery,
  useRefreshRepositoriesMutation
} from '../../redux/slices/api/integrationApiSlice';
import { toast } from 'sonner';
import { FaGithub, FaGitlab, FaSync } from 'react-icons/fa';
import Loader from '../Loader';
import { Dialog } from '@headlessui/react';
import Modal from '../Modal';

const GitIntegration = () => {
  const [connectToGitHub] = useConnectToGitHubMutation();
  const [connectToGitLab] = useConnectToGitLabMutation();
  const [refreshRepositories] = useRefreshRepositoriesMutation();
  const { data, isLoading, refetch } = useGetUserIntegrationsQuery();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // GitHub OAuth setup
  const handleGitHubLogin = () => {
    const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/settings/integrations/github/callback`;
    const scope = 'repo';
    
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };
  
  // GitLab OAuth setup
  const handleGitLabLogin = () => {
    const clientId = process.env.REACT_APP_GITLAB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/settings/integrations/gitlab/callback`;
    const scope = 'api';
    
    window.location.href = `https://gitlab.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  };
  
  // Handle OAuth callback
  const handleOAuthCallback = async (provider, code) => {
    try {
      if (provider === 'github') {
        await connectToGitHub({ code }).unwrap();
        toast.success('Connected to GitHub successfully');
      } else if (provider === 'gitlab') {
        await connectToGitLab({ code }).unwrap();
        toast.success('Connected to GitLab successfully');
      }
      
      refetch();
    } catch (error) {
      console.error(`Error connecting to ${provider}:`, error);
      toast.error(`Failed to connect to ${provider}`);
    }
  };
  
  // Refresh repositories for an integration
  const handleRefreshRepositories = async (integrationId) => {
    try {
      setIsRefreshing(true);
      await refreshRepositories(integrationId).unwrap();
      toast.success('Repositories refreshed successfully');
    } catch (error) {
      console.error('Error refreshing repositories:', error);
      toast.error('Failed to refresh repositories');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Render integrations list
  const renderIntegrations = () => {
    const integrations = data?.integrations || [];
    
    if (integrations.length === 0) {
      return (
        <div className="text-center py-6">
          <p className="text-gray-500">No Git integrations connected yet</p>
        </div>
      );
    }
    
    return integrations.map((integration) => (
      <div 
        key={integration._id} 
        className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {integration.provider === 'github' ? (
              <FaGithub className="text-xl text-gray-700" />
            ) : (
              <FaGitlab className="text-xl text-gray-700" />
            )}
            <div>
              <h3 className="font-medium">
                {integration.provider === 'github' ? 'GitHub' : 'GitLab'} ({integration.username})
              </h3>
              <p className="text-sm text-gray-500">
                {integration.repositories?.length || 0} repositories available
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => handleRefreshRepositories(integration._id)} 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
            disabled={isRefreshing}
          >
            <FaSync className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
        
        {integration.repositories && integration.repositories.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium mb-2">Repositories</h4>
            <div className="max-h-40 overflow-y-auto text-sm">
              {integration.repositories.map(repo => (
                <div key={repo.id} className="py-1 border-b border-gray-100 last:border-0">
                  <a 
                    href={repo.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {repo.fullName || repo.name}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ));
  };
  
  // Main component render
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Git Integrations</h2>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleGitHubLogin}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50"
        >
          <FaGithub className="text-xl" />
          Connect GitHub
        </button>
        
        <button
          onClick={handleGitLabLogin}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50"
        >
          <FaGitlab className="text-xl" />
          Connect GitLab
        </button>
        
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 text-blue-600 hover:text-blue-800"
        >
          Setup Instructions
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader />
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-medium mb-3">Active Integrations</h3>
          {renderIntegrations()}
        </div>
      )}
      
      <Modal
        open={showModal}
        setOpen={setShowModal}
        title="Git Integration Setup"
      >
        <div className="p-4">
          <h3 className="font-medium mb-2">Setting up GitHub integration:</h3>
          <ol className="list-decimal list-inside mb-4 space-y-2">
            <li>Go to GitHub Developer Settings &gt; OAuth Apps &gt; New OAuth App</li>
            <li>Set Application name: "TaskFlow"</li>
            <li>Homepage URL: <code className="bg-gray-100 px-1">{window.location.origin}</code></li>
            <li>Authorization callback URL: <code className="bg-gray-100 px-1">{window.location.origin}/settings/integrations/github/callback</code></li>
            <li>Register the application and copy the Client ID</li>
            <li>Add the Client ID to your .env file as REACT_APP_GITHUB_CLIENT_ID</li>
            <li>On the server, add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to your environment variables</li>
          </ol>
          
          <h3 className="font-medium mb-2">Setting up GitLab integration:</h3>
          <ol className="list-decimal list-inside mb-4 space-y-2">
            <li>Go to GitLab User Settings &gt; Applications</li>
            <li>Set Name: "TaskFlow"</li>
            <li>Redirect URI: <code className="bg-gray-100 px-1">{window.location.origin}/settings/integrations/gitlab/callback</code></li>
            <li>Scopes: api</li>
            <li>Add the Application and copy the Application ID</li>
            <li>Add the Application ID to your .env file as REACT_APP_GITLAB_CLIENT_ID</li>
            <li>On the server, add GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET to your environment variables</li>
          </ol>
        </div>
      </Modal>
    </div>
  );
};

export default GitIntegration;