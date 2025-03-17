import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  FormControl,
  Grid, 
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  Typography,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Description as CsvIcon,
  Schedule as ScheduleIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { 
  generateTaskReportPdf, 
  generateTaskReportExcel,
  generateTaskReportCSV,
  generateProjectReportPdf, 
  generateAnalyticsReportPdf 
} from '../../services/reportService';

const ReportManager = () => {
  const [reportType, setReportType] = useState('tasks');
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [scheduledReports, setScheduledReports] = useState([]);
  
  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    reportType: 'tasks',
    format: 'pdf',
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    projectId: '',
    emailRecipients: '',
    includeProjectDetails: true,
    includeAnalytics: false
  });
  
  const { token, user } = useSelector(state => state.auth);
  
  useEffect(() => {
    fetchProjects();
    fetchScheduledReports();
  }, []);
  
  useEffect(() => {
    if (reportType === 'project' && projectId) {
      fetchProjectTasks(projectId);
    } else if (reportType === 'tasks') {
      fetchAllTasks();
    } else if (reportType === 'analytics') {
      fetchAnalytics();
    }
  }, [reportType, projectId]);
  
  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status) {
        setProjects(response.data.projects || []);
        if (response.data.projects?.length > 0) {
          setProjectId(response.data.projects[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };
  
  const fetchAllTasks = async () => {
    setLoadingTasks(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 200,
          includeDetails: true
        }
      });
      
      if (response.data.status) {
        setTasks(response.data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  };
  
  const fetchProjectTasks = async (pid) => {
    setLoadingTasks(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/projects/${pid}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status) {
        setTasks(response.data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching project tasks:', error);
      toast.error('Failed to load project tasks');
    } finally {
      setLoadingTasks(false);
    }
  };
  
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoadingAnalytics(false);
    }
  };
  
  const fetchScheduledReports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/scheduled`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status) {
        setScheduledReports(response.data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      toast.error('Failed to load scheduled reports');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGenerateReport = async (format) => {
    try {
      setLoading(true);
      let fileName;
      
      if (reportType === 'tasks') {
        if (format === 'pdf') {
          fileName = generateTaskReportPdf(tasks, 'Task Report');
        } else if (format === 'excel') {
          fileName = generateTaskReportExcel(tasks, 'Task Report');
        } else if (format === 'csv') {
          fileName = generateTaskReportCSV(tasks);
        }
      } else if (reportType === 'project' && projectId) {
        const project = projects.find(p => p._id === projectId);
        if (project) {
          if (format === 'pdf') {
            fileName = generateProjectReportPdf(project, tasks);
          } else if (format === 'excel') {
            fileName = generateTaskReportExcel(tasks, `Project: ${project.name}`);
          } else if (format === 'csv') {
            fileName = generateTaskReportCSV(tasks);
          }
        }
      } else if (reportType === 'analytics') {
        if (format === 'pdf') {
          fileName = generateAnalyticsReportPdf(analytics);
        } else {
          toast.error('Analytics reports are only available in PDF format');
        }
      }
      
      if (fileName) {
        toast.success(`Report generated: ${fileName}`);
        
        // Log the report generation
        await axios.post(`${API_BASE_URL}/reports/log`, {
          type: reportType,
          format,
          projectId: reportType === 'project' ? projectId : undefined
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };
  
  const handleScheduleReport = async () => {
    try {
      setLoading(true);
      
      const response = await axios.post(
        `${API_BASE_URL}/reports/schedule`, 
        scheduleForm, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status) {
        toast.success('Report scheduled successfully');
        setOpenScheduleDialog(false);
        fetchScheduledReports();
      } else {
        toast.error(response.data.message || 'Failed to schedule report');
      }
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast.error('Failed to schedule report');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteScheduledReport = async (reportId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/reports/scheduled/${reportId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.status) {
        toast.success('Scheduled report deleted');
        fetchScheduledReports();
      } else {
        toast.error(response.data.message || 'Failed to delete scheduled report');
      }
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      toast.error('Failed to delete scheduled report');
    }
  };
  
  const handleScheduleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setScheduleForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Add this helper function to the ReportManager component
  const getDayName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum] || 'Unknown';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Report Manager
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Generate Reports
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Report Type"
              >
                <MenuItem value="tasks">All Tasks Report</MenuItem>
                <MenuItem value="project">Project Report</MenuItem>
                <MenuItem value="analytics">Analytics Report</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {reportType === 'project' && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={loadingProjects}>
                <InputLabel>Select Project</InputLabel>
                <Select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  label="Select Project"
                >
                  {projects.map(project => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PdfIcon />}
            onClick={() => handleGenerateReport('pdf')}
            disabled={loading || (reportType === 'project' && !projectId)}
          >
            Export as PDF
          </Button>
          
          <Button
            variant="contained"
            color="success"
            startIcon={<ExcelIcon />}
            onClick={() => handleGenerateReport('excel')}
            disabled={loading || reportType === 'analytics' || (reportType === 'project' && !projectId)}
          >
            Export as Excel
          </Button>
          
          <Button
            variant="contained"
            color="info"
            startIcon={<CsvIcon />}
            onClick={() => handleGenerateReport('csv')}
            disabled={loading || reportType === 'analytics' || (reportType === 'project' && !projectId)}
          >
            Export as CSV
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => setOpenScheduleDialog(true)}
            disabled={loading}
          >
            Schedule Report
          </Button>
        </Box>
        
        {(loadingTasks || loadingAnalytics) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Scheduled Reports
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : scheduledReports.length === 0 ? (
          <Alert severity="info">
            No scheduled reports found. Schedule a report to receive it automatically.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {scheduledReports.map((report) => (
              <Grid item xs={12} md={6} key={report._id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      {report.reportType === 'tasks' ? 'Task Report' : 
                        report.reportType === 'project' ? 'Project Report' : 
                        'Analytics Report'}
                    </Typography>
                    
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Frequency: {report.frequency === 'daily' ? 'Daily' : 
                          report.frequency === 'weekly' ? `Weekly (${getDayName(report.dayOfWeek)})` : 
                          `Monthly (Day ${report.dayOfMonth})`}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Format: {report.format.toUpperCase()}
                      </Typography>
                      
                      {report.reportType === 'project' && (
                        <Typography variant="body2" color="text.secondary">
                          Project: {projects.find(p => p._id === report.projectId)?.name || 'Unknown Project'}
                        </Typography>
                      )}
                      
                      <Typography variant="body2" color="text.secondary">
                        Recipients: {report.emailRecipients || 'None (download only)'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Next run: {format(new Date(report.nextRunDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button 
                        size="small" 
                        color="error" 
                        onClick={() => handleDeleteScheduledReport(report._id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      {/* Schedule Report Dialog */}
      <Dialog 
        open={openScheduleDialog} 
        onClose={() => setOpenScheduleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule Report</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    name="reportType"
                    value={scheduleForm.reportType}
                    onChange={handleScheduleFormChange}
                    label="Report Type"
                  >
                    <MenuItem value="tasks">All Tasks Report</MenuItem>
                    <MenuItem value="project">Project Report</MenuItem>
                    <MenuItem value="analytics">Analytics Report</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {scheduleForm.reportType === 'project' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Select Project</InputLabel>
                    <Select
                      name="projectId"
                      value={scheduleForm.projectId}
                      onChange={handleScheduleFormChange}
                      label="Select Project"
                    >
                      {projects.map(project => (
                        <MenuItem key={project._id} value={project._id}>
                          {project.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Format</InputLabel>
                  <Select
                    name="format"
                    value={scheduleForm.format}
                    onChange={handleScheduleFormChange}
                    label="Format"
                  >
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="excel" disabled={scheduleForm.reportType === 'analytics'}>Excel</MenuItem>
                    <MenuItem value="csv" disabled={scheduleForm.reportType === 'analytics'}>CSV</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    name="frequency"
                    value={scheduleForm.frequency}
                    onChange={handleScheduleFormChange}
                    label="Frequency"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {scheduleForm.frequency === 'weekly' && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Day of Week</InputLabel>
                    <Select
                      name="dayOfWeek"
                      value={scheduleForm.dayOfWeek}
                      onChange={handleScheduleFormChange}
                      label="Day of Week"
                    >
                      <MenuItem value={1}>Monday</MenuItem>
                      <MenuItem value={2}>Tuesday</MenuItem>
                      <MenuItem value={3}>Wednesday</MenuItem>
                      <MenuItem value={4}>Thursday</MenuItem>
                      <MenuItem value={5}>Friday</MenuItem>
                      <MenuItem value={6}>Saturday</MenuItem>
                      <MenuItem value={0}>Sunday</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
              
              {scheduleForm.frequency === 'monthly' && (
                <Grid item xs={12}>
                  <TextField 
                    fullWidth
                    label="Day of Month (1-28)"
                    name="dayOfMonth"
                    type="number"
                    value={scheduleForm.dayOfMonth || 1}
                    onChange={handleScheduleFormChange}
                    InputProps={{
                      inputProps: { min: 1, max: 28 }
                    }}
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <TextField 
                  fullWidth
                  label="Email Recipients (comma separated)"
                  name="emailRecipients"
                  value={scheduleForm.emailRecipients}
                  onChange={handleScheduleFormChange}
                  placeholder="email1@example.com, email2@example.com"
                  helperText="Leave blank to generate reports for download only"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={scheduleForm.includeProjectDetails || false}
                        onChange={handleScheduleFormChange}
                        name="includeProjectDetails"
                      />
                    }
                    label="Include project details (for project reports)"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={scheduleForm.includeAnalytics || false}
                        onChange={handleScheduleFormChange}
                        name="includeAnalytics"
                      />
                    }
                    label="Include analytics data"
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenScheduleDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleScheduleReport}
            variant="contained" 
            color="primary"
            disabled={loading || (scheduleForm.reportType === 'project' && !scheduleForm.projectId)}
          >
            Schedule Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportManager;