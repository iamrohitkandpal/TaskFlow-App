import mongoose, { Schema } from "mongoose";

const noticeSchema = new Schema(
  {
    team: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: true
    }],
    text: { 
      type: String, 
      required: [true, "Notice text is required"] 
    },
    task: { 
      type: Schema.Types.ObjectId, 
      ref: "Task",
      // Don't mark as required since not all notifications have a task
    },
    notiType: { 
      type: String, 
      default: "alert", 
      enum: ["alert", "message"] 
    },
    isRead: [{ 
      type: Schema.Types.ObjectId, 
      ref: "User",
      default: [] 
    }],
  },
  { timestamps: true }
);

const Notice = mongoose.model("Notice", noticeSchema);

export default Notice;
