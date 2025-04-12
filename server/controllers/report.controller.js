import ScheduledReport from '../models/scheduled-report.model.js';
import ReportLog from '../models/report-log.model.js';
import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import User from '../models/user.model.js';
import moment from 'moment';
import { getAnalyticsData } from './analytics.controller.js';
import { sendReportEmail } from '../services/email.service.js';

// Log a report generation
export const logReport = async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, format, projectId } = req.body;
    
    const log = new ReportLog({
      userId,
      type,
      format,
      projectId,
      status: 'success'
    });
    
    await log.save();
    
    res.status(200).json({ status: true, message: 'Report log created' });
  } catch (error) {
    console.error('Error logging report:', error);
    res.status(500).json({ status: false, message: 'Failed to log report' });
  }
};

// Schedule a new report
export const scheduleReport = async (req, res) => {
  try {
    const { userId } = req.user;
    const { 
      reportType, format, frequency, dayOfWeek, dayOfMonth, 
      projectId, emailRecipients, includeProjectDetails, includeAnalytics 
    } = req.body;
    
    // Validate report parameters based on type
    if (reportType === 'project' && !projectId) {
      return res.status(400).json({ 
        status: false, 
        message: 'Project ID is required for project reports' 
      });
    }
    
    if (frequency === 'weekly' && dayOfWeek === undefined) {
      return res.status(400).json({ 
        status: false, 
        message: 'Day of week is required for weekly reports' 
      });
    }
    
    if (frequency === 'monthly' && !dayOfMonth) {
      return res.status(400).json({ 
        status: false, 
        message: 'Day of month is required for monthly reports' 
      });
    }
    
    // Calculate next run date
    const nextRunDate = calculateNextRunDate(frequency, dayOfWeek, dayOfMonth);
    
    // Create scheduled report
    const report = new ScheduledReport({
      userId,
      reportType,
      format,
      frequency,
      dayOfWeek,
      dayOfMonth,
      projectId,
      emailRecipients,
      nextRunDate,
      includeProjectDetails,
      includeAnalytics
    });
    
    await report.save();
    
    res.status(201).json({ 
      status: true, 
      message: 'Report scheduled successfully',
      report
    });
  } catch (error) {
    console.error('Error scheduling report:', error);
    res.status(500).json({ 
      status: false, 
      message: 'Failed to schedule report' 
    });
  }
};

// Get all scheduled reports for the current user
export const getScheduledReports = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const reports = await ScheduledReport.find({ userId })
      .sort({ nextRunDate: 1 })
      .lean();
    
    res.status(200).json({ status: true, reports });
  } catch (error) {
    console.error('Error getting scheduled reports:', error);
    res.status(500).json({ status: false, message: 'Failed to get scheduled reports' });
  }
};

// Delete a scheduled report
export const deleteScheduledReport = async (req, res) => {
  try {
    const { userId } = req.user;
    const { reportId } = req.params;
    
    const report = await ScheduledReport.findOne({ _id: reportId, userId });
    
    if (!report) {
      return res.status(404).json({ status: false, message: 'Report not found' });
    }
    
    await report.deleteOne();
    
    res.status(200).json({ status: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    res.status(500).json({ status: false, message: 'Failed to delete report' });
  }
};

// Get the user's report generation history
export const getReportLogs = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const logs = await ReportLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    res.status(200).json({ status: true, logs });
  } catch (error) {
    console.error('Error getting report logs:', error);
    res.status(500).json({ status: false, message: 'Failed to get report logs' });
  }
};

// Helper function to calculate the next run date for a scheduled report
const calculateNextRunDate = (frequency, dayOfWeek, dayOfMonth) => {
  let date = moment();
  
  switch (frequency) {
    case 'daily':
      // Next day at 1:00 AM
      date = date.add(1, 'day').set('hour', 1).set('minute', 0).set('second', 0);
      break;
      
    case 'weekly':
      // Next occurrence of the specified day of week at 1:00 AM
      const daysToAdd = (7 + dayOfWeek - date.day()) % 7;
      date = date.add(daysToAdd || 7, 'days').set('hour', 1).set('minute', 0).set('second', 0);
      break;
      
    case 'monthly':
      // Next occurrence of the specified day of month at 1:00 AM
      const currentMonth = date.month();
      date = date.date(dayOfMonth).set('hour', 1).set('minute', 0).set('second', 0);
      
      // If the day has passed in the current month, move to next month
      if (date.month() !== currentMonth || date.isBefore(moment())) {
        date = date.add(1, 'month');
      }
      break;
  }
  
  return date.toDate();
};

// Process all scheduled reports (to be called by a cron job)
export const processScheduledReports = async () => {
  try {
    console.log('Processing scheduled reports...');
    
    // Get all reports scheduled to run now or in the past
    const reports = await ScheduledReport.find({
      nextRunDate: { $lte: new Date() }
    }).populate('userId', 'email name');
    
    console.log(`Found ${reports.length} reports to process`);
    
    for (const report of reports) {
      try {
        await processReport(report);
        
        // Update next run date and last run date
        report.lastRunDate = new Date();
        report.nextRunDate = calculateNextRunDate(
          report.frequency, 
          report.dayOfWeek, 
          report.dayOfMonth
        );
        
        await report.save();
      } catch (error) {
        console.error(`Error processing report ${report._id}:`, error);
        
        // Log the error
        const log = new ReportLog({
          userId: report.userId._id,
          type: report.reportType,
          format: report.format,
          projectId: report.projectId,
          scheduledReportId: report._id,
          status: 'failed',
          errorMessage: error.message || 'Unknown error'
        });
        
        await log.save();
      }
    }
    
    console.log('Finished processing scheduled reports');
  } catch (error) {
    console.error('Error in processScheduledReports:', error);
  }
};

// Process a single report
const processReport = async (report) => {
  try {
    let data;
    let title;
    
    // Get data for the report
    if (report.reportType === 'tasks') {
      const tasks = await Task.find()
        .populate('assignee', 'name')
        .lean();
        
      data = tasks;
      title = 'Task Report';
    } else if (report.reportType === 'project' && report.projectId) {
      const project = await Project.findById(report.projectId).lean();
      
      if (!project) {
        throw new Error(`Project not found with ID: ${report.projectId}`);
      }
      
      const tasks = await Task.find({ projectId: report.projectId })
        .populate('assignee', 'name')
        .lean();
        
      data = { project, tasks };
      title = `Project: ${project.name}`;
    } else if (report.reportType === 'analytics') {
      // Get analytics data
      const analyticsData = await getAnalyticsData(report.userId._id);
      data = analyticsData;
      title = 'Analytics Report';
    } else {
      throw new Error(`Unsupported report type: ${report.reportType}`);
    }
    
    // Generate the report
    const reportFile = await generateReport(report.format, report.reportType, data, title);
    
    // Send email if recipients are specified
    if (report.emailRecipients) {
      const recipients = report.emailRecipients.split(',').map(email => email.trim());
      
      if (recipients.length > 0) {
        await sendReportEmail({
          recipients,
          reportType: report.reportType,
          format: report.format,
          title,
          data,
          senderName: report.userId.name,
          attachmentPath: reportFile
        });
        
        // Log the report generation
        const log = new ReportLog({
          userId: report.userId._id,
          type: report.reportType,
          format: report.format,
          projectId: report.projectId,
          scheduledReportId: report._id,
          recipients,
          status: 'success'
        });
        
        await log.save();
      }
    }
    
    return reportFile;
  } catch (error) {
    console.error('Error processing report:', error);
    throw error;
  }
};

// Generate a report and return the file path
const generateReport = async (format, type, data, title) => {
  // This would call the same functions that are used in the frontend
  // In a real implementation, you would create server-side versions of the PDF/Excel/CSV generators
  
  // For demonstration, we'll just return a mock file path
  return `/tmp/report_${type}_${Date.now()}.${format}`;
};