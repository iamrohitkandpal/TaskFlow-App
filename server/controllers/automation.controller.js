import {
  getAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule
} from '../services/automation.service.js';
import Project from '../models/project.model.js';

// Controller to get all automation rules for a project
export const getProjectAutomationRules = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.user;
    
    // Verify user has access to this project
    const project = await Project.findOne({ _id: projectId, members: userId });
    
    if (!project) {
      return res.status(403).json({
        status: false,
        message: 'You do not have access to this project'
      });
    }
    
    const rules = await getAutomationRules(projectId);
    
    res.status(200).json({
      status: true,
      rules
    });
  } catch (error) {
    console.error('Error in getProjectAutomationRules:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while fetching automation rules'
    });
  }
};

// Controller to create a new automation rule
export const createProjectAutomationRule = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.user;
    const ruleData = req.body;
    
    // Verify user has access to this project
    const project = await Project.findOne({ _id: projectId, members: userId });
    
    if (!project) {
      return res.status(403).json({
        status: false,
        message: 'You do not have access to this project'
      });
    }
    
    // Add project and user IDs to the rule data
    ruleData.projectId = projectId;
    ruleData.createdBy = userId;
    
    const newRule = await createAutomationRule(ruleData);
    
    res.status(201).json({
      status: true,
      message: 'Automation rule created successfully',
      rule: newRule
    });
  } catch (error) {
    console.error('Error in createProjectAutomationRule:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while creating automation rule'
    });
  }
};

// Controller to update an existing automation rule
export const updateProjectAutomationRule = async (req, res) => {
  try {
    const { projectId, ruleId } = req.params;
    const { userId } = req.user;
    const ruleData = req.body;
    
    // Verify user has access to this project
    const project = await Project.findOne({ _id: projectId, members: userId });
    
    if (!project) {
      return res.status(403).json({
        status: false,
        message: 'You do not have access to this project'
      });
    }
    
    // Don't allow changing project or created by
    delete ruleData.projectId;
    delete ruleData.createdBy;
    
    const updatedRule = await updateAutomationRule(ruleId, ruleData);
    
    if (!updatedRule) {
      return res.status(404).json({
        status: false,
        message: 'Automation rule not found'
      });
    }
    
    res.status(200).json({
      status: true,
      message: 'Automation rule updated successfully',
      rule: updatedRule
    });
  } catch (error) {
    console.error('Error in updateProjectAutomationRule:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while updating automation rule'
    });
  }
};

// Controller to delete an automation rule
export const deleteProjectAutomationRule = async (req, res) => {
  try {
    const { projectId, ruleId } = req.params;
    const { userId } = req.user;
    
    // Verify user has access to this project
    const project = await Project.findOne({ _id: projectId, members: userId });
    
    if (!project) {
      return res.status(403).json({
        status: false,
        message: 'You do not have access to this project'
      });
    }
    
    const deletedRule = await deleteAutomationRule(ruleId);
    
    if (!deletedRule) {
      return res.status(404).json({
        status: false,
        message: 'Automation rule not found'
      });
    }
    
    res.status(200).json({
      status: true,
      message: 'Automation rule deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteProjectAutomationRule:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while deleting automation rule'
    });
  }
};