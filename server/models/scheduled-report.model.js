import mongoose from 'mongoose';

const scheduledReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    enum: ['tasks', 'project', 'analytics'],
    required: true
  },
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv'],
    required: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6,
    required: function() {
      return this.frequency === 'weekly';
    }
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 28,
    required: function() {
      return this.frequency === 'monthly';
    }
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: function() {
      return this.reportType === 'project';
    }
  },
  emailRecipients: {
    type: String
  },
  nextRunDate: {
    type: Date,
    required: true
  },
  lastRunDate: {
    type: Date
  },
  includeProjectDetails: {
    type: Boolean,
    default: true
  },
  includeAnalytics: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const ScheduledReport = mongoose.model('ScheduledReport', scheduledReportSchema);

export default ScheduledReport;