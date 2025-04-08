import React, { useState } from 'react';
import { useGetUserIntegrationsQuery, useLinkGitReferenceMutation } from '../../redux/slices/api/integrationApiSlice';
import { FaGithub, FaGitlab, FaCodeBranch, FaCodePullRequest, FaPlus } from 'react-icons/fa';
import Modal from '../Modal';
import { toast } from 'sonner';

const GitReferences = ({ taskId, gitReferences = [] }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [linkType, setLinkType] = useState('pr');
  const [selectedProvider, setSelectedProvider] = useState('github');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [reference, setReference] = useState('');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  
  const { data: integrationsData } = useGetUserIntegrationsQuery();
  const [linkGitReference] = useLinkGitReferenceMutation();
  
  const availableRepositories = React.useMemo(() => {
    const integrations = integrationsData?.integrations || [];
    const selectedIntegration = integrations.find(i => i.provider === selectedProvider);
    return selectedIntegration?.repositories || [];
  }, [integrationsData, selectedProvider]);
  
  const handleLink = async () => {
    try {
      if (!reference || !selectedRepo || !title || !url) {
        toast.error('Please fill in all fields');
        return;
      }
      
      await linkGitReference({
        taskId,
        reference: {
          type: linkType,
          provider: selectedProvider,
          repository: selectedRepo,
          reference: reference,
          title: title,
          url: url,
          status: linkType === 'pr' ? 'open' : 'committed'
        }
      }).unwrap();
      
      toast.success('Git reference linked successfully');
      setIsLinking(false);
      
      // Reset form
      setLinkType('pr');
      setSelectedProvider('github');
      setSelectedRepo('');
      setReference('');
      setTitle('');
      setUrl('');
    } catch (error) {
      console.error('Error linking git reference:', error);
      toast.error('Failed to link git reference');
    }
  };
  
  // Format URL helper based on selected type and provider
  const handleRepositoryChange = (repoName) => {
    setSelectedRepo(repoName);
    
    if (linkType === 'pr') {
      if (selectedProvider === 'github') {
        const baseUrl = repoName.includes('/') ? `https://github.com/${repoName}` : '';
        setUrl(baseUrl ? `${baseUrl}/pull/` : '');
      } else {
        const baseUrl = repoName.includes('/') ? `https://gitlab.com/${repoName}` : '';
        setUrl(baseUrl ? `${baseUrl}/-/merge_requests/` : '');
      }
    } else {
      if (selectedProvider === 'github') {
        const baseUrl = repoName.includes('/') ? `https://github.com/${repoName}` : '';
        setUrl(baseUrl ? `${baseUrl}/commit/` : '');
      } else {
        const baseUrl = repoName.includes('/') ? `https://gitlab.com/${repoName}` : '';
        setUrl(baseUrl ? `${baseUrl}/-/commit/` : '');
      }
    }
  };
  
  // Auto-generate title format when user changes type
  const handleTypeChange = (type) => {
    setLinkType(type);
    if (type === 'pr') {
      setTitle('Pull Request: ');
    } else {
      setTitle('Commit: ');
    }
    
    // Update URL format too
    if (selectedRepo) {
      handleRepositoryChange(selectedRepo);
    }
  };
  
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Git References</h3>
        <button
          onClick={() => setIsLinking(true)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <FaPlus size={14} />
          Link Reference
        </button>
      </div>
      
      {gitReferences.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No Git references linked to this task</p>
      ) : (
        <div className="space-y-2">
          {gitReferences.map((ref, index) => (
            <a 
              key={index} 
              href={ref.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 text-sm"
            >
              {ref.provider === 'github' ? <FaGithub /> : <FaGitlab />}
              
              {ref.type === 'pr' ? <FaCodePullRequest /> : <FaCodeBranch />}
              
              <div className="flex-1">
                <div className="font-medium">{ref.title}</div>
                <div className="text-xs text-gray-500">
                  {ref.repository} • {ref.reference} • {ref.status}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
      
      <Modal
        open={isLinking}
        setOpen={setIsLinking}
        title="Link Git Reference"
      >
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleTypeChange('pr')}
                className={`px-3 py-2 border rounded-md flex items-center gap-2 ${
                  linkType === 'pr' 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <FaCodePullRequest />
                Pull Request / Merge Request
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('commit')}
                className={`px-3 py-2 border rounded-md flex items-center gap-2 ${
                  linkType === 'commit' 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <FaCodeBranch />
                Commit
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedProvider('github')}
                className={`px-3 py-2 border rounded-md flex items-center gap-2 ${
                  selectedProvider === 'github' 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <FaGithub />
                GitHub
              </button>
              <button
                type="button"
                onClick={() => setSelectedProvider('gitlab')}
                className={`px-3 py-2 border rounded-md flex items-center gap-2 ${
                  selectedProvider === 'gitlab' 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <FaGitlab />
                GitLab
              </button>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="repository" className="block text-sm font-medium text-gray-700 mb-1">Repository</label>
            <select
              id="repository"
              value={selectedRepo}
              onChange={(e) => handleRepositoryChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select Repository</option>
              {availableRepositories.map(repo => (
                <option key={repo.id} value={repo.fullName || repo.name}>
                  {repo.fullName || repo.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
              {linkType === 'pr' ? 'PR/MR Number' : 'Commit Hash'}
            </label>
            <input
              id="reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder={linkType === 'pr' ? '42' : 'abc123def456'}
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Fix bug in authentication"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="https://github.com/user/repo/pull/42"
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsLinking(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLink}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Link Reference
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GitReferences;

// Add this inside the TaskDetails component, near the bottom of the return statement
<div className="mt-8">
  <GitReferences taskId={taskId} gitReferences={task.gitReferences || []} />
</div>