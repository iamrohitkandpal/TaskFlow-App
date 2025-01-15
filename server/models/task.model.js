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
      enum: ["todo", "in-progress", "completed"],
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
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
