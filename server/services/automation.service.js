import AutomationRule from '../models/automation.model.js';
import Task from '../models/task.model.js';
import { notifyTaskUpdate } from './notification.service.js';

// Execute automation rules for a task based on a trigger type
export const executeRulesForTask = async (task, triggerType, oldTask = null) => {
  try {
    // Find project ID for this task
    const projectId = task.projectId;
    
    // Find all enabled automation rules for this project and trigger type
    const rules = await AutomationRule.find({
      projectId,
      enabled: true,
      'trigger.type': triggerType
    }).populate('action.settings.assignee action.settings.notifyUsers');
    
    if (!rules || rules.length === 0) {
      return { success: true, message: 'No automation rules found' };
    }
    
    // Execute each matching rule
    const results = await Promise.all(rules.map(rule => executeRule(rule, task, oldTask)));
    
    return { success: true, executedRules: results.filter(r => r.executed) };
  } catch (error) {
    console.error('Error executing automation rules:', error);
    return { success: false, error: error.message };
  }
};

// Check if a task meets all conditions for a rule
const doesTaskMatchConditions = (task, rule, oldTask = null) => {
  const { conditions } = rule.trigger;
  
  // If no conditions specified, rule applies
  if (!conditions) return true;
  
  // Check priority condition
  if (conditions.priority && task.priority !== conditions.priority) {
    return false;
  }
  
  // Check assignee condition
  if (conditions.assignee && task.assignee.toString() !== conditions.assignee.toString()) {
    return false;
  }
  
  // For taskUpdated trigger, check if the specified field changed
  if (rule.trigger.type === 'taskUpdated' && oldTask && conditions.fieldChanged) {
    if (conditions.fieldChanged === 'any') {
      return true; // Any change matches
    }
    
    if (conditions.fieldChanged === 'status') {
      return task.status !== oldTask.status;
    }
    
    if (conditions.fieldChanged === 'assignee') {
      const newAssignee = task.assignee?.toString() || null;
      const oldAssignee = oldTask.assignee?.toString() || null;
      return newAssignee !== oldAssignee;
    }
    
    if (conditions.fieldChanged === 'priority') {
      return task.priority !== oldTask.priority;
    }
  }
  
  // For deadlineApproaching, check days before deadline
  if (rule.trigger.type === 'deadlineApproaching' && task.dueDate) {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    return daysRemaining <= conditions.daysBeforeDeadline && daysRemaining >= 0;
  }
  
  return true;
};

// Execute a specific rule for a task
const executeRule = async (rule, task, oldTask = null) => {
  try {
    // Check if task meets the conditions
    if (!doesTaskMatchConditions(task, rule, oldTask)) {
      return { executed: false, rule: rule._id, reason: 'conditions_not_met' };
    }
    
    // Execute the appropriate action based on action type
    switch (rule.action.type) {
      case 'sendNotification':
        await executeNotificationAction(rule, task);
        break;
      case 'changeStatus':
        await executeChangeStatusAction(rule, task);
        break;
      case 'changePriority':
        await executeChangePriorityAction(rule, task);
        break;
      case 'assignUser':
        await executeAssignUserAction(rule, task);
        break;
      default:
        return { executed: false, rule: rule._id, reason: 'unknown_action_type' };
    }
    
    return { executed: true, rule: rule._id, action: rule.action.type };
  } catch (error) {
    console.error(`Error executing rule ${rule._id}:`, error);
    return { executed: false, rule: rule._id, error: error.message };
  }
};

// Execute notification action
const executeNotificationAction = async (rule, task) => {
  const { settings } = rule.action;
  const message = settings.notificationMessage || `Automated notification for task: ${task.title}`;
  
  // Use the existing notification service
  await notifyTaskUpdate(task._id, message, 'automation');
};

// Execute change status action
const executeChangeStatusAction = async (rule, task) => {
  const { settings } = rule.action;
  
  if (settings.newStatus && task.status !== settings.newStatus) {
    task.status = settings.newStatus;
    await task.save();
  }
};

// Execute change priority action
const executeChangePriorityAction = async (rule, task) => {
  const { settings } = rule.action;
  
  if (settings.newPriority && task.priority !== settings.newPriority) {
    task.priority = settings.newPriority;
    await task.save();
  }
};

// Execute assign user action
const executeAssignUserAction = async (rule, task) => {
  const { settings } = rule.action;
  
  if (settings.assignee) {
    const assigneeId = settings.assignee._id || settings.assignee;
    
    if (!task.assignee || task.assignee.toString() !== assigneeId.toString()) {
      task.assignee = assigneeId;
      await task.save();
    }
  }
};

// Get automation rules for a project
export const getAutomationRules = async (projectId) => {
  try {
    return await AutomationRule.find({ projectId })
      .populate('createdBy', 'name email')
      .populate('action.settings.assignee', 'name email')
      .populate('action.settings.notifyUsers', 'name email');
  } catch (error) {
    console.error('Error getting automation rules:', error);
    throw error;
  }
};

// Create a new automation rule
export const createAutomationRule = async (ruleData) => {
  try {
    const newRule = new AutomationRule(ruleData);
    await newRule.save();
    return newRule;
  } catch (error) {
    console.error('Error creating automation rule:', error);
    throw error;
  }
};

// Update an existing automation rule
export const updateAutomationRule = async (ruleId, ruleData) => {
  try {
    return await AutomationRule.findByIdAndUpdate(ruleId, ruleData, { new: true });
  } catch (error) {
    console.error('Error updating automation rule:', error);
    throw error;
  }
};

// Delete an automation rule
export const deleteAutomationRule = async (ruleId) => {
  try {
    return await AutomationRule.findByIdAndDelete(ruleId);
  } catch (error) {
    console.error('Error deleting automation rule:', error);
    throw error;
  }
};