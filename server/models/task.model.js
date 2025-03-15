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

const Task = mongoose.model("Task", taskSchema);

export default Task;
