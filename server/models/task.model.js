import mongoose, { Schema } from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
    },
    date: {
      type: Date,
      default: () => new Date(),
    },
    priority: {
      type: String,
      enum: ["low", "normal", "medium", "high"],
      default: "normal",
    },
    stage: {
      type: String,
      enum: ["todo", "in progress", "completed"],
      default: "todo",
    },
    activities: [
      {
        type: {
          type: String,
          default: "assigned",
          enum: [
            "assigned",
            "started",
            "in progress",
            "bug",
            "completed",
            "commented",
          ],
        },
        activity: { type: String, required: true },
        date: { type: Date, default: () => new Date() },
        by: { type: Schema.Types.ObjectId, ref: "User" },
      },
    ],
    subTasks: [
      {
        title: String,
        date: Date,
        tag: String,
      },
    ],
    assets: [String],
    team: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isTrashed: { type: Boolean, default: false },
    gitReferences: [
      {
        type: {
          type: String,
          enum: ["commit", "pr", "issue"],
          required: true,
        },
        provider: {
          type: String,
          enum: ["github", "gitlab"],
          required: true,
        },
        repository: String,
        reference: String, // commit hash, PR number, etc.
        title: String,
        url: String,
        status: String,
      },
    ],
    taskIdentifier: {
      type: String,
      unique: true,
      sparse: true,
    },
    calendarEventId: String,
    calendarSync: {
      synced: {
        type: Boolean,
        default: false,
      },
      provider: {
        type: String,
        enum: ["caldav", "nextcloud", "ical"],
      },
      calendarId: String,
      lastSynced: Date,
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
      webhook: String,
      events: {
        taskCreated: {
          type: Boolean,
          default: true,
        },
        taskUpdated: {
          type: Boolean,
          default: true,
        },
        taskCompleted: {
          type: Boolean,
          default: true,
        },
        commentAdded: {
          type: Boolean,
          default: true,
        },
      },
    },
    dependencies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }],
  },
  { timestamps: true }
);

// Add text index for natural language search
taskSchema.index({ 
  title: 'text', 
  description: 'text', 
  comments: 'text' 
});

// Pre-save validation middleware
taskSchema.pre('save', function(next) {
  // Validate required fields
  if (!this.title) {
    const error = new Error('Task title is required');
    return next(error);
  }
  
  // Validate enum fields
  if (this.priority && !['low', 'medium', 'high', 'normal'].includes(this.priority.toLowerCase())) {
    this.priority = 'normal'; // Default to normal if invalid
  }

  if (this.stage && !['backlog', 'todo', 'in-progress', 'review', 'completed'].includes(this.stage.toLowerCase())) {
    this.stage = 'backlog'; // Default to backlog if invalid
  }
  
  next();
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
