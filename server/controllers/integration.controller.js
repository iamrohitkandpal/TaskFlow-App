import {
  connectToGitHub,
  connectToGitLab,
  fetchGitHubRepositories,
  fetchGitLabRepositories,
  linkGitReference,
  handleGitHubWebhook,
  handleGitLabWebhook
} from '../services/git-integration.service.js';
import Integration from '../models/integration.model.js';

// Connect to GitHub
export const connectGitHub = async (req, res) => {
  try {
    const { code } = req.body;
    const { userId } = req.user;
    
    if (!code) {
      return res.status(400).json({
        status: false,
        message: 'Authorization code is required'
      });
    }
    
    const result = await connectToGitHub(code, userId);
    
    res.status(200).json({
      status: true,
      message: 'Connected to GitHub successfully',
      integration: {
        provider: result.integration.provider,
        username: result.integration.username,
        repositories: result.repositories
      }
    });
  } catch (error) {
    console.error('Error in connectGitHub controller:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to connect to GitHub'
    });
  }
};

// Connect to GitLab
export const connectGitLab = async (req, res) => {
  try {
    const { code } = req.body;
    const { userId } = req.user;
    
    if (!code) {
      return res.status(400).json({
        status: false,
        message: 'Authorization code is required'
      });
    }
    
    const result = await connectToGitLab(code, userId);
    
    res.status(200).json({
      status: true,
      message: 'Connected to GitLab successfully',
      integration: {
        provider: result.integration.provider,
        username: result.integration.username,
        repositories: result.repositories
      }
    });
  } catch (error) {
    console.error('Error in connectGitLab controller:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to connect to GitLab'
    });
  }
};

// Get user's Git integrations
export const getUserIntegrations = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const integrations = await Integration.find({
      user: userId,
      active: true
    }).select('provider username repositories');
    
    res.status(200).json({
      status: true,
      integrations
    });
  } catch (error) {
    console.error('Error in getUserIntegrations controller:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to get user integrations'
    });
  }
};

// Refresh repositories for a specific integration
export const refreshRepositories = async (req, res) => {
  try {
    const { integrationId } = req.params;
    const { userId } = req.user;
    
    const integration = await Integration.findOne({
      _id: integrationId,
      user: userId
    });
    
    if (!integration) {
      return res.status(404).json({
        status: false,
        message: 'Integration not found'
      });
    }
    
    let repositories;
    if (integration.provider === 'github') {
      repositories = await fetchGitHubRepositories(integration);
    } else if (integration.provider === 'gitlab') {
      repositories = await fetchGitLabRepositories(integration);
    }
    
    res.status(200).json({
      status: true,
      message: 'Repositories refreshed successfully',
      repositories
    });
  } catch (error) {
    console.error('Error in refreshRepositories controller:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to refresh repositories'
    });
  }
};

// Link a Git reference (commit, PR, issue) to a task
export const linkReference = async (req, res) => {
  try {
    const { taskId } = req.params;
    const gitReference = req.body;
    
    const result = await linkGitReference(taskId, gitReference);
    
    res.status(200).json({
      status: true,
      message: result.message,
      task: result.task
    });
  } catch (error) {
    console.error('Error in linkReference controller:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to link Git reference'
    });
  }
};

// Handle GitHub webhook
export const githubWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-hub-signature'];
    const { secret } = req.params;
    
    await handleGitHubWebhook(payload, signature, secret);
    
    res.status(200).json({
      status: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Error in githubWebhook controller:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to process webhook'
    });
  }
};

// Handle GitLab webhook
export const gitlabWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const token = req.headers['x-gitlab-token'];
    const { secret } = req.params;
    
    await handleGitLabWebhook(payload, token, secret);
    
    res.status(200).json({
      status: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Error in gitlabWebhook controller:', error);
    res.status(500).json({
      status: false,
      message: 'Failed to process webhook'
    });
  }
};