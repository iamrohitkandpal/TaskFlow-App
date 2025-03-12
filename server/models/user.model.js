import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    role: {
      type: String,
      enum: ["Admin", "Manager", "Developer", "Viewer"],
      default: "Viewer",
      required: [true, "Role is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    tasks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    calendar: {
      type: {
        type: String,
        enum: ["caldav", "nextcloud", "ical"],
      },
      url: String,
      username: String,
      password: String, // In production, this should be encrypted
      calendars: [
        {
          id: String,
          name: String,
        },
      ],
      active: {
        type: Boolean,
        default: true,
      },
    },
    notifications: {
      enabled: {
        type: Boolean,
        default: true,
      },
      webhook: String,
      events: {
        taskAssigned: {
          type: Boolean,
          default: true,
        },
        taskCompleted: {
          type: Boolean,
          default: true,
        },
        mentionedInComment: {
          type: Boolean,
          default: true,
        },
        deadlineApproaching: {
          type: Boolean,
          default: true,
        },
      },
    },
    skills: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (inputPassword) {
  return await bcrypt.compare(inputPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
