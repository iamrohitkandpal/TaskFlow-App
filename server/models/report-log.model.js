import mongoose from 'mongoose';

const reportLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['tasks', 'project', 'analytics'],
    required: true
  },
  format: {
    type: String,
    enum: ['pdf', 'excel', 'csv'],
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  scheduledReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScheduledReport'
  },
  recipients: [String],
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: true,
    default: 'success'
  },
  errorMessage: String
}, { timestamps: true });

const ReportLog = mongoose.model('ReportLog', reportLogSchema);

export default ReportLog;