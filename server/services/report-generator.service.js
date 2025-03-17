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

// Create a PDF report
export const createReportPdf = async (reportType, data, title) => {
  try {
    const pdfDoc = await PDFDocument.create();
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
      // Tasks report
      const tasks = data;
      
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
        
        // Task title
        page.drawText(task.title.substring(0, 30) + (task.title.length > 30 ? '...' : ''), {
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
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    const filePath = generateFileName(reportType, 'pdf');
    
    fs.writeFileSync(filePath, pdfBytes);
    return filePath;
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};

// Create an Excel or CSV report
export const createReportExcel = async (reportType, data, title, format = 'xlsx') => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);
    
    // Add title and date
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = title;
    worksheet.getCell('A1').font = {
      size: 16,
      bold: true
    };
    
    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = `Generated on: ${formatDate(new Date())}`;
    worksheet.getCell('A2').font = {
      size: 12,
      italic: true
    };
    
    let rowIndex = 4;
    
    if (reportType === 'tasks') {
      // Add header
      worksheet.addRow(['Task', 'Status', 'Priority', 'Assigned To', 'Due Date']);
      worksheet.getRow(rowIndex).font = { bold: true };
      worksheet.getRow(rowIndex).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4A86E8' }
      };
      worksheet.getRow(rowIndex).alignment = { vertical: 'middle', horizontal: 'center' };
      rowIndex++;
      
      // Add data
      const tasks = data;
      for (const task of tasks) {
        worksheet.addRow([
          task.title,
          task.stage || 'N/A',
          task.priority || 'N/A',
          task.assignee?.name || 'Unassigned',
          formatDate(task.dueDate)
        ]);
        rowIndex++;
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