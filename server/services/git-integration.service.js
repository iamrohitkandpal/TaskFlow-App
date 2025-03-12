import axios from 'axios';
import Integration from '../models/integration.model.js';
import Task from '../models/task.model.js';
import crypto from 'crypto';

// Connect to GitHub
export const connectToGitHub = async (code, userId) => {
  try {
    // GitHub OAuth App credentials (store these in env variables in production)
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code
      },
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    if (!access_token) {
      throw new Error('Failed to get GitHub access token');
    }
    
    // Get user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${access_token}`
      }
    });
    
    const { login: username } = userResponse.data;
    
    // Create or update integration record
    let integration = await Integration.findOne({ 
      user: userId, 
      provider: 'github'
    });
    
    if (integration) {
      integration.accessToken = access_token;
      integration.username = username;
      integration.active = true;
    } else {
      integration = new Integration({
        user: userId,
        provider: 'github',
        accessToken: access_token,
        username,
        repositories: [],
        webhookSecret: crypto.randomBytes(20).toString('hex')
      });
    }
    
    await integration.save();
    
    // Get user repositories
    const repositories = await fetchGitHubRepositories(integration);
    
    return {
      success: true,
      integration,
      repositories
    };
  } catch (error) {
    console.error('Error connecting to GitHub:', error);
    throw error;
  }
};

// Connect to GitLab
export const connectToGitLab = async (code, userId) => {
  try {
    // GitLab OAuth App credentials (store these in env variables in production)
    const clientId = process.env.GITLAB_CLIENT_ID;
    const clientSecret = process.env.GITLAB_CLIENT_SECRET;
    const redirectUri = process.env.GITLAB_REDIRECT_URI;
    
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://gitlab.com/oauth/token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    if (!access_token) {
      throw new Error('Failed to get GitLab access token');
    }
    
    // Get user info
    const userResponse = await axios.get('https://gitlab.com/api/v4/user', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const { username } = userResponse.data;
    
    // Create or update integration record
    let integration = await Integration.findOne({ 
      user: userId, 
      provider: 'gitlab'
    });
    
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expires_in);
    
    if (integration) {
      integration.accessToken = access_token;
      integration.refreshToken = refresh_token;
      integration.tokenExpiry = tokenExpiry;
      integration.username = username;
      integration.active = true;
    } else {
      integration = new Integration({
        user: userId,
        provider: 'gitlab',
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry,
        username,
        webhookSecret: crypto.randomBytes(20).toString('hex')
      });
    }
    
    await integration.save();
    
    // Get user repositories
    const repositories = await fetchGitLabRepositories(integration);
    
    return {
      success: true,
      integration,
      repositories
    };
  } catch (error) {
    console.error('Error connecting to GitLab:', error);
    throw error;
  }
};

// Fetch GitHub repositories
export const fetchGitHubRepositories = async (integration) => {
  try {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${integration.accessToken}`
      },
      params: {
        sort: 'updated',
        per_page: 100
      }
    });
    
    const repositories = response.data.map(repo => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url
    }));
    
    // Update integration with repositories
    integration.repositories = repositories;
    await integration.save();
    
    return repositories;
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    throw error;
  }
};

// Fetch GitLab repositories
export const fetchGitLabRepositories = async (integration) => {
  try {
    const response = await axios.get('https://gitlab.com/api/v4/projects', {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`
      },
      params: {
        membership: true,
        order_by: 'last_activity_at',
        per_page: 100
      }
    });
    
    const repositories = response.data.map(repo => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.path_with_namespace,
      url: repo.web_url
    }));
    
    // Update integration with repositories
    integration.repositories = repositories;
    await integration.save();
    
    return repositories;
  } catch (error) {
    console.error('Error fetching GitLab repositories:', error);
    throw error;
  }
};

// Link a GitHub/GitLab commit or PR to a task
export const linkGitReference = async (taskId, gitReference) => {
  try {
    const task = await Task.findById(taskId);
    
    if (!task) {
      throw new Error('Task not found');
    }
    
    if (!task.gitReferences) {
      task.gitReferences = [];
    }
    
    // Check for duplicates
    const isDuplicate = task.gitReferences.some(ref => 
      ref.url === gitReference.url
    );
    
    if (isDuplicate) {
      return {
        success: false,
        message: 'This reference is already linked to the task'
      };
    }
    
    // Add git reference
    task.gitReferences.push({
      type: gitReference.type, // 'commit', 'pr', 'issue'
      provider: gitReference.provider, // 'github', 'gitlab'
      repository: gitReference.repository,
      reference: gitReference.reference, // commit hash, PR number, etc.
      title: gitReference.title,
      url: gitReference.url,
      status: gitReference.status || 'open'
    });
    
    await task.save();
    
    return {
      success: true,
      message: 'Git reference linked successfully',
      task
    };
  } catch (error) {
    console.error('Error linking git reference:', error);
    throw error;
  }
};

// Handle GitHub webhook events
export const handleGitHubWebhook = async (payload, signature, secret) => {
  try {
    // Verify webhook signature
    const calculatedSignature = 'sha1=' + crypto
      .createHmac('sha1', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    if (calculatedSignature !== signature) {
      throw new Error('Invalid webhook signature');
    }
    
    // Handle different webhook events
    if (payload.pull_request) {
      // Handle PR events
      await handlePullRequestEvent(payload, 'github');
    } else if (payload.commits) {
      // Handle push events with commits
      await handleCommitEvent(payload, 'github');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error handling GitHub webhook:', error);
    throw error;
  }
};

// Handle GitLab webhook events
export const handleGitLabWebhook = async (payload, token, secret) => {
  try {
    // Verify webhook token
    if (token !== secret) {
      throw new Error('Invalid webhook token');
    }
    
    // Handle different webhook events
    if (payload.object_kind === 'merge_request') {
      // Handle merge request events
      await handlePullRequestEvent(payload, 'gitlab');
    } else if (payload.object_kind === 'push') {
      // Handle push events
      await handleCommitEvent(payload, 'gitlab');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error handling GitLab webhook:', error);
    throw error;
  }
};

// Handle pull request/merge request events
const handlePullRequestEvent = async (payload, provider) => {
  try {
    let prNumber, repoFullName, prTitle, prState, prUrl;
    
    if (provider === 'github') {
      prNumber = payload.pull_request.number;
      repoFullName = payload.repository.full_name;
      prTitle = payload.pull_request.title;
      prState = payload.pull_request.state;
      prUrl = payload.pull_request.html_url;
    } else if (provider === 'gitlab') {
      prNumber = payload.object_attributes.iid;
      repoFullName = payload.project.path_with_namespace;
      prTitle = payload.object_attributes.title;
      prState = payload.object_attributes.state;
      prUrl = payload.object_attributes.url;
    }
    
    // Look for task number in PR title or body (e.g. "TASK-123: Fix bug")
    const taskRegex = /TASK[-\s]?(\d+)/i;
    let taskIdentifier;
    
    if (prTitle) {
      const match = prTitle.match(taskRegex);
      if (match) taskIdentifier = match[1];
    }
    
    if (taskIdentifier) {
      // Find task with this identifier
      const task = await Task.findOne({ taskIdentifier });
      
      if (task) {
        // Update task git references
        if (!task.gitReferences) {
          task.gitReferences = [];
        }
        
        // Check if PR is already linked
        const existingRefIndex = task.gitReferences.findIndex(ref => 
          ref.type === 'pr' && 
          ref.provider === provider && 
          ref.reference === prNumber.toString()
        );
        
        if (existingRefIndex >= 0) {
          // Update existing reference
          task.gitReferences[existingRefIndex].status = prState;
        } else {
          // Add new reference
          task.gitReferences.push({
            type: 'pr',
            provider,
            repository: repoFullName,
            reference: prNumber.toString(),
            title: prTitle,
            url: prUrl,
            status: prState
          });
        }
        
        // If PR is merged, update task status
        if ((provider === 'github' && prState === 'closed' && payload.pull_request.merged) ||
            (provider === 'gitlab' && prState === 'merged')) {
          // Only move to completed if it's not already there
          if (task.stage !== 'completed') {
            task.stage = 'completed';
            task.activities.push({
              type: 'completed',
              activity: `Task completed automatically via ${provider} PR #${prNumber}`,
              date: new Date()
            });
          }
        }
        
        await task.save();
      }
    }
  } catch (error) {
    console.error('Error handling pull request event:', error);
    throw error;
  }
};

// Handle commit events
const handleCommitEvent = async (payload, provider) => {
  try {
    let commits, repoFullName;
    
    if (provider === 'github') {
      commits = payload.commits;
      repoFullName = payload.repository.full_name;
    } else if (provider === 'gitlab') {
      commits = payload.commits;
      repoFullName = payload.project.path_with_namespace;
    }
    
    if (!commits || commits.length === 0) return;
    
    // Look for task references in commit messages
    const taskRegex = /TASK[-\s]?(\d+)/i;
    
    for (const commit of commits) {
      const match = commit.message.match(taskRegex);
      if (!match) continue;
      
      const taskIdentifier = match[1];
      const task = await Task.findOne({ taskIdentifier });
      
      if (task) {
        // Update task git references
        if (!task.gitReferences) {
          task.gitReferences = [];
        }
        
        let commitHash, commitMessage, commitUrl;
        
        if (provider === 'github') {
          commitHash = commit.id;
          commitMessage = commit.message;
          commitUrl = `https://github.com/${repoFullName}/commit/${commit.id}`;
        } else if (provider === 'gitlab') {
          commitHash = commit.id;
          commitMessage = commit.message;
          commitUrl = commit.url;
        }
        
        // Check if commit is already linked
        const isDuplicate = task.gitReferences.some(ref => 
          ref.type === 'commit' && 
          ref.provider === provider && 
          ref.reference === commitHash
        );
        
        if (!isDuplicate) {
          // Add new reference
          task.gitReferences.push({
            type: 'commit',
            provider,
            repository: repoFullName,
            reference: commitHash,
            title: commitMessage.split('\n')[0], // First line of commit message
            url: commitUrl,
            status: 'committed'
          });
          
          // Add activity for the commit
          task.activities.push({
            type: 'commit',
            activity: `New commit: ${commitMessage.split('\n')[0]}`,
            date: new Date(commit.timestamp)
          });
          
          await task.save();
        }
      }
    }
  } catch (error) {
    console.error('Error handling commit event:', error);
    throw error;
  }
};