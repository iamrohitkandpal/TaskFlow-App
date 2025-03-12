import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  wipLimit: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system'
  },
  notificationPreferences: {
    email: {
      taskAssigned: { type: Boolean, default: true },
      taskCompleted: { type: Boolean, default: true },
      deadlineApproaching: { type: Boolean, default: true }
    },
    inApp: {
      mentions: { type: Boolean, default: true },
      taskUpdates: { type: Boolean, default: true },
      systemNotifications: { type: Boolean, default: true }
    }
  }
}, { timestamps: true });

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);

export default UserSettings;