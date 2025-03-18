import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ExcelJS from 'exceljs';
import moment from 'moment';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, '../tmp/reports');

// Create reports directory if it doesn't exist
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Helper to format dates
const formatDate = (date) => {
  if (!date) return 'N/A';
  return moment(date).format('MMM DD, YYYY');
};

// Generate a unique filename
const generateFileName = (reportType, format) => {
  const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
  return path.join(REPORTS_DIR, `taskflow_${reportType}_${timestamp}.${format}`);
};

// Clean HTML tags from text
const cleanHtml = (text) => {
  if (!text) return '';
  return text.replace(/<[^>]*>/g, ' ').replace(/\s{2,}/g, ' ').trim();
};

// Cleanup placeholder comment blocks
// Replace with meaningful comments for PDF generation methods

/**
 * Formats task data into a properly structured table for PDF reports
 * @param {Object} task - Task object with properties like title, status, priority, etc
 * @param {Number} yPosition - Current Y position on the PDF document
 * @param {Object} page - PDF document page reference
 * @param {Object} font - Font object for text rendering
 * @param {Array} columnWidths - Array of column width values
 * @returns {Number} - Updated Y position after drawing the row
 */
const drawTaskRow = (task, yPosition, page, font, columnWidths) => {
  // Implementation continues...
}

// Create a PDF report with memory optimization
export const createReportPdf = async (reportType, data, title) => {
  try {
    // Create PDF document with compression options
    const pdfDoc = await PDFDocument.create({
      updateMetadata: true,
      compress: true
    });
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Add a page
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    // Add title
    page.drawText(title, {
      x: 50,
      y: height - 50,
      size: 24,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1)
    });
    
    // Add date
    page.drawText(`Generated on: ${formatDate(new Date())}`, {
      x: 50,
      y: height - 80,
      size: 12,
      font: font,
      color: rgb(0.3, 0.3, 0.3)
    });
    
    let yPosition = height - 120;
    
    if (reportType === 'tasks') {
      // Tasks report - limit to 200 tasks maximum per report
      const tasks = Array.isArray(data) ? 
        (data.length > 200 ? data.slice(0, 200) : data) : [];
      
      // Add table header
      const columns = ['Task', 'Status', 'Priority', 'Assigned To', 'Due Date'];
      const columnWidths = [200, 80, 80, 100, 100];
      const startX = 50;
      
      // Draw header
      page.drawRectangle({
        x: startX,
        y: yPosition - 20,
        width: columnWidths.reduce((a, b) => a + b, 0),
        height: 20,
        color: rgb(0.2, 0.4, 0.6)
      });
      
      let headerX = startX + 5;
      for (let i = 0; i < columns.length; i++) {
        page.drawText(columns[i], {
          x: headerX,
          y: yPosition - 15,
          size: 12,
          font: boldFont,
          color: rgb(1, 1, 1)
        });
        headerX += columnWidths[i];
      }
      
      // Draw rows
      yPosition -= 30;
      
      for (const task of tasks) {
        // Check if we need a new page
        if (yPosition < 100) {
          page = pdfDoc.addPage();
          yPosition = height - 50;
        }
        
        let rowX = startX + 5;
        
        // Truncate task title if too long
        const truncatedTitle = task.title ? 
          (task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title) : 
          'Untitled';
        
        // Task title
        page.drawText(truncatedTitle, {
          x: rowX,
          y: yPosition,
          size: 10,
          font: font
        });
        rowX += columnWidths[0];
        
        // Status
        page.drawText(task.stage || 'N/A', {
          x: rowX,
          y: yPosition,
          size: 10,
          font: font
        });
        rowX += columnWidths[1];
        
        // Priority
        page.drawText(task.priority || 'N/A', {
          x: rowX,
          y: yPosition,
          size: 10,
          font: font
        });
        rowX += columnWidths[2];
        
        // Assigned to
        page.drawText(task.assignee?.name || 'Unassigned', {
          x: rowX,
          y: yPosition,
          size: 10,
          font: font
        });
        rowX += columnWidths[3];
        
        // Due date
        page.drawText(formatDate(task.dueDate), {
          x: rowX,
          y: yPosition,
          size: 10,
          font: font
        });
        
        yPosition -= 25;
      }
      
      // If we truncated the tasks, add a note
      if (data.length > 200) {
        page.drawText(`Note: This report shows 200 tasks out of ${data.length} total tasks.`, {
          x: 50,
          y: 50,
          size: 10,
          font: boldFont,
          color: rgb(0.5, 0, 0)
        });
      }
      
    } else if (reportType === 'analytics') {
      // Analytics report
      if (data.taskStatusDistribution) {
        page.drawText('Task Status Distribution', {
          x: 50,
          y: yPosition,
          size: 16,
          font: boldFont
        });
        
        yPosition -= 30;
        
        const { statusCounts } = data.taskStatusDistribution;
        page.drawText(`To Do: ${statusCounts.todo || 0}`, {
          x: 70,
          y: yPosition,
          size: 12,
          font: font
        });
        
        yPosition -= 20;
        
        page.drawText(`In Progress: ${statusCounts['in progress'] || 0}`, {
          x: 70,
          y: yPosition,
          size: 12,
          font: font
        });
        
        yPosition -= 20;
        
        page.drawText(`Completed: ${statusCounts.completed || 0}`, {
          x: 70,
          y: yPosition,
          size: 12,
          font: font
        });
        
        yPosition -= 40;
      }
      
      if (data.completionTime) {
        page.drawText('Task Completion Metrics', {
          x: 50,
          y: yPosition,
          size: 16,
          font: boldFont
        });
        
        yPosition -= 30;
        
        page.drawText(`Average Completion Time: ${data.completionTime.average} days`, {
          x: 70,
          y: yPosition,
          size: 12,
          font: font
        });
        
        yPosition -= 20;
        
        page.drawText(`Fastest Completion: ${data.completionTime.min} days`, {
          x: 70,
          y: yPosition,
          size: 12,
          font: font
        });
        
        yPosition -= 20;
        
        page.drawText(`Slowest Completion: ${data.completionTime.max} days`, {
          x: 70,
          y: yPosition,
          size: 12,
          font: font
        });
      }
    }
    
    // Add page numbers
    const pageCount = pdfDoc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      
      page.drawText(`Page ${i + 1} of ${pageCount}`, {
        x: width / 2,
        y: 30,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      });
    }
    
    // Save the PDF with compression
    const pdfBytes = await pdfDoc.save({ 
      useObjectStreams: true 
    });
    
    const filePath = generateFileName(reportType, 'pdf');
    
    fs.writeFileSync(filePath, pdfBytes);
    return filePath;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};

// Create an Excel or CSV report with memory optimization
export const createReportExcel = async (reportType, data, title, format = 'xlsx') => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TaskFlow';
    workbook.lastModifiedBy = 'TaskFlow';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Size limits to prevent memory issues
    const MAX_ROWS = 5000;
    
    // Add title and date as document properties
    workbook.properties.title = title;
    workbook.properties.subject = 'TaskFlow Report';
    
    // Create worksheet
    const worksheet = workbook.addWorksheet(title.substring(0, 31)); // Excel limits sheet names to 31 chars
    
    // Add header row with styling
    worksheet.addRow([title]);
    worksheet.addRow([`Generated on: ${formatDate(new Date())}`]);
    worksheet.addRow([]); // Empty row
    
    // Style the header
    worksheet.getCell('A1').font = { bold: true, size: 14 };
    worksheet.getCell('A2').font = { italic: true, size: 10 };
    
    // Set column widths for better readability
    worksheet.getColumn(1).width = 30;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 20;
    worksheet.getColumn(5).width = 15;
    
    let rowIndex = 4; // Start after the header rows
    
    if (reportType === 'tasks' || reportType === 'project') {
      // Get tasks data
      const tasks = reportType === 'tasks' ? data : data.tasks;
      
      // If too many tasks, truncate to prevent memory issues
      const limitedTasks = Array.isArray(tasks) && tasks.length > MAX_ROWS ? 
        tasks.slice(0, MAX_ROWS) : 
        tasks;
      
      // Add column headers
      const headerRow = worksheet.addRow(['Title', 'Status', 'Priority', 'Assigned To', 'Due Date']);
      headerRow.font = { bold: true };
      headerRow.eachCell(cell => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4A90E2' }
        };
        cell.font = { color: { argb: 'FFFFFF' }, bold: true };
      });
      
      rowIndex++;
      
      // Add task data with batching to reduce memory consumption
      if (Array.isArray(limitedTasks)) {
        const BATCH_SIZE = 100;
        for (let i = 0; i < limitedTasks.length; i += BATCH_SIZE) {
          const batch = limitedTasks.slice(i, i + BATCH_SIZE);
          
          for (const task of batch) {
            // Add each task as a row in the worksheet with proper data formatting
            const row = worksheet.addRow([
              task.title || 'Untitled',
              task.stage || 'N/A',
              task.priority || 'N/A',
              task.assignee?.name || 'Unassigned',
              formatDate(task.dueDate)
            ]);
            
            // Apply conditional formatting based on priority
            if (task.priority === 'high') {
              row.getCell(3).font = { color: { argb: 'FF0000' } }; // Red for high priority
            } else if (task.priority === 'medium') {
              row.getCell(3).font = { color: { argb: 'FF9900' } }; // Orange for medium priority
            }
            
            // Apply status-based formatting
            if (task.stage === 'completed') {
              row.getCell(2).font = { color: { argb: '008000' } }; // Green for completed
            } else if (task.stage === 'in progress') {
              row.getCell(2).font = { color: { argb: '0000FF' } }; // Blue for in progress
            }
            rowIndex++;
          }
        }
      }
      
      // If we truncated the tasks, add a note
      if (Array.isArray(tasks) && tasks.length > MAX_ROWS) {
        worksheet.addRow([]);
        worksheet.addRow([`Note: This report shows ${MAX_ROWS} tasks out of ${tasks.length} total tasks.`]);
        worksheet.getCell(`A${rowIndex + 1}`).font = { italic: true, color: { argb: 'FF0000' } };
      }
      
    } else if (reportType === 'analytics') {
      // Task Status Distribution
      if (data.taskStatusDistribution) {
        worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
        worksheet.getCell(`A${rowIndex}`).value = 'Task Status Distribution';
        worksheet.getCell(`A${rowIndex}`).font = { bold: true, size: 14 };
        rowIndex += 2;
        
        const { statusCounts } = data.taskStatusDistribution;
        worksheet.addRow(['Status', 'Count']);
        worksheet.getRow(rowIndex).font = { bold: true };
        rowIndex++;
        
        worksheet.addRow(['To Do', statusCounts.todo || 0]);
        rowIndex++;
        
        worksheet.addRow(['In Progress', statusCounts['in progress'] || 0]);
        rowIndex++;
        
        worksheet.addRow(['Completed', statusCounts.completed || 0]);
        rowIndex += 2;
      }
      
      // Task Completion Metrics
      if (data.completionTime) {
        worksheet.mergeCells(`A${rowIndex}:C${rowIndex}`);
        worksheet.getCell(`A${rowIndex}`).value = 'Task Completion Metrics';
        worksheet.getCell(`A${rowIndex}`).font = { bold: true, size: 14 };
        rowIndex += 2;
        
        worksheet.addRow(['Metric', 'Value (days)']);
        worksheet.getRow(rowIndex).font = { bold: true };
        rowIndex++;
        
        worksheet.addRow(['Average Completion Time', data.completionTime.average]);
        rowIndex++;
        
        worksheet.addRow(['Fastest Completion', data.completionTime.min]);
        rowIndex++;
        
        worksheet.addRow(['Slowest Completion', data.completionTime.max]);
        rowIndex += 2;
      }
    }
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Write to file
    const filePath = generateFileName(reportType, format);
    
    if (format === 'xlsx') {
      await workbook.xlsx.writeFile(filePath);
    } else if (format === 'csv') {
      await workbook.csv.writeFile(filePath);
    }
    
    return filePath;
  } catch (error) {
    console.error(`Error generating ${format} report:`, error);
    throw error;
  }
};