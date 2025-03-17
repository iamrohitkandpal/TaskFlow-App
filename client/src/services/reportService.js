import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Helper to format dates
const formatDate = (date) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'MMM dd, yyyy');
};

// Helper to get PDF file name
const getPdfFileName = (reportType) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  return `taskflow_${reportType}_${timestamp}.pdf`;
};

// Helper to get Excel file name
const getExcelFileName = (reportType) => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  return `taskflow_${reportType}_${timestamp}.xlsx`;
};

// Generate task report as PDF
export const generateTaskReportPdf = (tasks, title = 'Task Report') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${formatDate(new Date())}`, 14, 30);
  
  // Configure table data
  const tableColumn = ['Task', 'Status', 'Priority', 'Assigned To', 'Due Date'];
  const tableRows = tasks.map(task => [
    task.title,
    task.stage || 'N/A',
    task.priority || 'N/A',
    task.assignee?.name || 'Unassigned',
    formatDate(task.dueDate)
  ]);
  
  // Generate table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 35 },
  });
  
  // Save PDF
  const fileName = getPdfFileName('tasks');
  doc.save(fileName);
  return fileName;
};

// Generate task report as Excel
export const generateTaskReportExcel = (tasks, title = 'Task Report') => {
  // Prepare worksheet data
  const worksheet = XLSX.utils.json_to_sheet(tasks.map(task => ({
    'Title': task.title,
    'Description': task.description?.replace(/<[^>]+>/g, ' ') || '', // Remove HTML tags
    'Status': task.stage || '',
    'Priority': task.priority || '',
    'Assigned To': task.assignee?.name || 'Unassigned',
    'Due Date': formatDate(task.dueDate),
    'Created Date': formatDate(task.createdAt),
    'Updated Date': formatDate(task.updatedAt)
  })));
  
  // Create workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title);
  
  // Save Excel file
  const fileName = getExcelFileName('tasks');
  XLSX.writeFile(workbook, fileName);
  return fileName;
};

// Generate CSV file
export const generateTaskReportCSV = (tasks) => {
  // Convert tasks to worksheet
  const worksheet = XLSX.utils.json_to_sheet(tasks.map(task => ({
    'Title': task.title,
    'Description': task.description?.replace(/<[^>]+>/g, ' ') || '',
    'Status': task.stage || '',
    'Priority': task.priority || '',
    'Assigned To': task.assignee?.name || 'Unassigned',
    'Due Date': formatDate(task.dueDate)
  })));
  
  // Create CSV content
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create a link and trigger download
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const fileName = `taskflow_tasks_${timestamp}.csv`;
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return fileName;
};

// Generate project report as PDF
export const generateProjectReportPdf = (project, tasks) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(`Project: ${project.name}`, 14, 22);
  
  // Add project details
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${formatDate(new Date())}`, 14, 30);
  doc.text(`Project Start: ${formatDate(project.startDate)}`, 14, 36);
  doc.text(`Project Deadline: ${formatDate(project.endDate)}`, 14, 42);
  
  // Add project description
  doc.setFontSize(12);
  doc.text('Description:', 14, 50);
  
  const cleanDescription = project.description?.replace(/<[^>]+>/g, ' ') || 'No description available';
  
  // Handle long descriptions with word wrap
  const splitDescription = doc.splitTextToSize(cleanDescription, 180);
  doc.text(splitDescription, 14, 58);
  
  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.stage === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.stage === 'in-progress').length;
  const todoTasks = tasks.filter(t => t.stage === 'todo').length;
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Add task statistics
  doc.setFontSize(14);
  doc.text('Task Statistics', 14, 90);
  
  doc.setFontSize(10);
  doc.text(`Total Tasks: ${totalTasks}`, 20, 98);
  doc.text(`Completed: ${completedTasks} (${completionRate}%)`, 20, 104);
  doc.text(`In Progress: ${inProgressTasks}`, 20, 110);
  doc.text(`To Do: ${todoTasks}`, 20, 116);
  
  // Add task list table
  doc.setFontSize(14);
  doc.text('Tasks', 14, 126);
  
  const tableColumn = ['Task', 'Status', 'Priority', 'Assigned To', 'Due Date'];
  const tableRows = tasks.map(task => [
    task.title,
    task.stage || 'N/A',
    task.priority || 'N/A',
    task.assignee?.name || 'Unassigned',
    formatDate(task.dueDate)
  ]);
  
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 130,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    }
  });
  
  // Save PDF
  const fileName = getPdfFileName(`project_${project._id}`);
  doc.save(fileName);
  return fileName;
};

// Generate analytics report as PDF
export const generateAnalyticsReportPdf = (analytics) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Analytics Report', 14, 22);
  
  // Add date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${formatDate(new Date())}`, 14, 30);
  
  // Task status distribution
  if (analytics.taskStatusDistribution) {
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Task Status Distribution', 14, 45);
    
    const { statusCounts } = analytics.taskStatusDistribution;
    
    doc.setFontSize(10);
    doc.text(`To Do: ${statusCounts.todo || 0}`, 20, 53);
    doc.text(`In Progress: ${statusCounts['in progress'] || 0}`, 20, 59);
    doc.text(`Completed: ${statusCounts.completed || 0}`, 20, 65);
  }
  
  // Task completion time
  if (analytics.completionTime) {
    doc.setFontSize(14);
    doc.text('Task Completion Metrics', 14, 80);
    
    doc.setFontSize(10);
    doc.text(`Average Completion Time: ${analytics.completionTime.average} days`, 20, 88);
    doc.text(`Fastest Completion: ${analytics.completionTime.min} days`, 20, 94);
    doc.text(`Slowest Completion: ${analytics.completionTime.max} days`, 20, 100);
  }
  
  // Team productivity
  if (analytics.userProductivity && analytics.userProductivity.length > 0) {
    doc.setFontSize(14);
    doc.text('Team Productivity', 14, 115);
    
    const teamData = analytics.userProductivity.map(user => [
      user.name,
      user.metrics.tasksCompleted,
      `${user.metrics.completionRate}%`,
      user.metrics.avgCompletionTime
    ]);
    
    autoTable(doc, {
      head: [['Team Member', 'Tasks Completed', 'Completion Rate', 'Avg Time (Days)']],
      body: teamData,
      startY: 120,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      }
    });
  }
  
  // Save PDF
  const fileName = getPdfFileName('analytics');
  doc.save(fileName);
  return fileName;
};