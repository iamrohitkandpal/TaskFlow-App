import mongoose, { Schema } from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["planning", "active", "on-hold", "completed"],
      default: "active",
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
    tags: [String],
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Create text index for search functionality
projectSchema.index({ 
  name: 'text', 
  description: 'text'
});

const Project = mongoose.model("Project", projectSchema);

export default Project;