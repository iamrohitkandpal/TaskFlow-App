import mongoose from 'mongoose';

const automationRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  // Define the trigger condition
  trigger: {
    type: {
      type: String,
      enum: ['taskCreated', 'taskUpdated', 'taskCompleted', 'deadlineApproaching', 'commentAdded'],
      required: true
    },
    conditions: {
      // For deadlineApproaching, specify days before deadline
      daysBeforeDeadline: {
        type: Number,
        default: 1
      },
      // For taskUpdated, specify what fields to watch
      fieldChanged: {
        type: String,
        enum: ['status', 'assignee', 'priority', 'any']
      },
      // Optional filter for specific task criteria
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'none']
      },
      assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  // Define the action to execute
  action: {
    type: {
      type: String,
      enum: ['sendNotification', 'changeStatus', 'changePriority', 'assignUser'],
      required: true
    },
    // Settings for the action
    settings: {
      // For sendNotification
      notificationMessage: String,
      notifyUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      // For changeStatus
      newStatus: {
        type: String,
        enum: ['todo', 'in-progress', 'review', 'completed']
      },
      // For changePriority
      newPriority: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      // For assignUser
      assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  }
}, { timestamps: true });

const AutomationRule = mongoose.model('AutomationRule', automationRuleSchema);

export default AutomationRule;