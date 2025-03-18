import mongoose from "mongoose";

/**
 * Activity Model Schema
 * 
 * Tracks user actions and task changes for audit trail and activity feed.
 * Used for real-time collaboration features and history tracking.
 */
const activitySchema = new mongoose.Schema(
  {
    // User who performed the action
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Type of activity performed
    action: {
      type: String,
      required: true,
      enum: ["create", "update", "delete", "comment", "status_change", "assign"],
    },
    // Associated task
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    // Additional action details (varies based on action type)
    details: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;