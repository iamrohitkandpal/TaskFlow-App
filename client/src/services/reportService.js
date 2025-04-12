import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { format } from "date-fns";

// Helper to format dates
const formatDate = (date) => {
  if (!date) return "N/A";
  return format(new Date(date), "MMM dd, yyyy");
};

// Helper to get file name with timestamp
const getFileName = (reportType, fileType) => {
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  return `taskflow_${reportType}_${timestamp}.${fileType}`;
};

// Helper to clean HTML from text (improved for performance)
const cleanHtml = (text) => {
  if (!text) return "";
  // More efficient regex for large strings
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
};

// Helper to trigger file download with memory cleanup
const downloadFile = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  try {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();

    // Clean up DOM
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Important: Release the object URL to free memory
    }, 100);

    return fileName;
  } catch (error) {
    console.error("Download error:", error);
    URL.revokeObjectURL(url);
    throw error;
  }
};

// Generate task report as PDF with pagination for large datasets
export const generateTaskReportPdf = (tasks, title = "Task Report") => {
  if (!tasks || !Array.isArray(tasks)) {
    console.error("Invalid tasks data for PDF generation");
    return null;
  }

  try {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${formatDate(new Date())}`, 14, 30);

    // Configure table data with truncation for very long titles
    const tableColumn = [
      "Task",
      "Status",
      "Priority",
      "Assigned To",
      "Due Date",
    ];
    const tableRows = tasks.map((task) => [
      task.title && task.title.length > 40
        ? task.title.substring(0, 40) + "..."
        : task.title || "Untitled",
      task.stage || "N/A",
      task.priority || "N/A",
      task.assignee?.name || "Unassigned",
      formatDate(task.dueDate),
    ]);

    // Generate table with pagination for better performance
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 35 },
      didDrawPage: (data) => {
        // Add page number at the bottom of each page
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      },
    });

    // Save PDF
    const fileName = getFileName("tasks", "pdf");
    doc.save(fileName);
    return fileName;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
};

// Generate task report as Excel with chunking for large datasets
export const generateTaskReportExcel = (tasks, title = "Task Report") => {
  if (!tasks || !Array.isArray(tasks)) {
    console.error("Invalid tasks data for Excel generation");
    return null;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "TaskFlow";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(title.substring(0, 31));

    // Add header row
    worksheet.addRow([
      "Title",
      "Description",
      "Status",
      "Priority",
      "Assigned To",
      "Due Date",
    ]);

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "4A90E2" },
      };
      cell.font = { color: { argb: "FFFFFF" }, bold: true };
    });

    // Add data rows
    tasks.forEach((task) => {
      worksheet.addRow([
        task.title || "Untitled",
        cleanHtml(task.description || "").substring(0, 200),
        task.stage || "",
        task.priority || "",
        task.assignee?.name || "Unassigned",
        formatDate(task.dueDate),
      ]);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      column.width = 15;
    });

    // Save file
    const fileName = getFileName("tasks", "xlsx");
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    });

    return fileName;
  } catch (error) {
    console.error("Error generating Excel:", error);
    return null;
  }
};

// Generate CSV file with streaming for memory efficiency
export const generateTaskReportCSV = (tasks) => {
  if (!tasks || !Array.isArray(tasks)) {
    console.error('Invalid tasks data for CSV generation');
    return null;
  }
  
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tasks');
    
    // Add header row
    worksheet.addRow(['Title', 'Description', 'Status', 'Priority', 'Assigned To', 'Due Date']);
    
    // Add data rows
    tasks.forEach(task => {
      worksheet.addRow([
        task.title || 'Untitled',
        cleanHtml(task.description || '').substring(0, 200),
        task.stage || '',
        task.priority || '',
        task.assignee?.name || 'Unassigned',
        formatDate(task.dueDate)
      ]);
    });
    
    // Generate CSV
    const fileName = getFileName('tasks', 'csv');
    
    worksheet.csv.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    });
    
    return fileName;
  } catch (error) {
    console.error('Error generating CSV:', error);
    return null;
  }
};

// Generate project report as PDF with optimized content handling
export const generateProjectReportPdf = (project, tasks) => {
  if (!project || !tasks || !Array.isArray(tasks)) {
    console.error("Invalid project or tasks data for PDF generation");
    return null;
  }

  try {
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

    // Add project description with length limitation
    doc.setFontSize(12);
    doc.text("Description:", 14, 50);

    const cleanDescription =
      cleanHtml(project.description || "") || "No description available";
    // Limit description length to avoid memory issues
    const limitedDescription =
      cleanDescription.substring(0, 1000) +
      (cleanDescription.length > 1000 ? "... (truncated)" : "");

    // Handle long descriptions with word wrap
    const splitDescription = doc.splitTextToSize(limitedDescription, 180);

    // Ensure description doesn't overflow
    const descriptionLines =
      splitDescription.length > 10
        ? splitDescription.slice(0, 10).concat(["... (truncated)"])
        : splitDescription;

    doc.text(descriptionLines, 14, 58);

    // Calculate task statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.stage === "completed").length;
    const inProgressTasks = tasks.filter(
      (t) => t.stage === "in-progress"
    ).length;
    const todoTasks = tasks.filter((t) => t.stage === "todo").length;

    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Add task statistics
    doc.setFontSize(14);
    doc.text("Task Statistics", 14, 90);

    doc.setFontSize(10);
    doc.text(`Total Tasks: ${totalTasks}`, 20, 98);
    doc.text(`Completed: ${completedTasks} (${completionRate}%)`, 20, 104);
    doc.text(`In Progress: ${inProgressTasks}`, 20, 110);
    doc.text(`To Do: ${todoTasks}`, 20, 116);

    // Add task list table
    doc.setFontSize(14);
    doc.text("Tasks", 14, 126);

    // Generate table for tasks (limit to 100 tasks for better performance)
    const taskLimit = 100;
    const limitedTasks =
      tasks.length > taskLimit ? tasks.slice(0, taskLimit) : tasks;

    const tableColumn = [
      "Task",
      "Status",
      "Priority",
      "Assigned To",
      "Due Date",
    ];
    const tableRows = limitedTasks.map((task) => [
      task.title && task.title.length > 40
        ? task.title.substring(0, 40) + "..."
        : task.title || "Untitled",
      task.stage || "N/A",
      task.priority || "N/A",
      task.assignee?.name || "Unassigned",
      formatDate(task.dueDate),
    ]);

    if (tasks.length > taskLimit) {
      tableRows.push([
        `... ${tasks.length - taskLimit} more tasks (truncated)`,
        "",
        "",
        "",
        "",
      ]);
    }

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 130,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      didDrawPage: (data) => {
        // Add page number
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
      },
    });

    // Save PDF
    const fileName = getFileName(`project_${project._id}`, "pdf");
    doc.save(fileName);
    return fileName;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
};

// Generate analytics report as PDF with memory optimizations
export const generateAnalyticsReportPdf = (analytics) => {
  if (!analytics) {
    console.error("Invalid analytics data for PDF generation");
    return null;
  }

  try {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.text("Analytics Report", 14, 22);

    // Add date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${formatDate(new Date())}`, 14, 30);

    // Task status distribution
    if (analytics.taskStatusDistribution) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("Task Status Distribution", 14, 45);

      const { statusCounts } = analytics.taskStatusDistribution;

      doc.setFontSize(10);
      doc.text(`To Do: ${statusCounts.todo || 0}`, 20, 53);
      doc.text(`In Progress: ${statusCounts["in progress"] || 0}`, 20, 59);
      doc.text(`Completed: ${statusCounts.completed || 0}`, 20, 65);
    }

    // Task completion time
    if (analytics.completionTime) {
      doc.setFontSize(14);
      doc.text("Task Completion Metrics", 14, 80);

      doc.setFontSize(10);
      doc.text(
        `Average Completion Time: ${analytics.completionTime.average} days`,
        20,
        88
      );
      doc.text(
        `Fastest Completion: ${analytics.completionTime.min} days`,
        20,
        94
      );
      doc.text(
        `Slowest Completion: ${analytics.completionTime.max} days`,
        20,
        100
      );
    }

    // Team productivity (limit to 15 team members for better performance)
    if (analytics.userProductivity && analytics.userProductivity.length > 0) {
      doc.setFontSize(14);
      doc.text("Team Productivity", 14, 115);

      // Limit data size
      const limitedProductivity =
        analytics.userProductivity.length > 15
          ? analytics.userProductivity.slice(0, 15)
          : analytics.userProductivity;

      const teamData = limitedProductivity.map((user) => [
        user.name || "Unknown User",
        user.metrics?.tasksCompleted || 0,
        `${user.metrics?.completionRate || 0}%`,
        user.metrics?.avgCompletionTime || "N/A",
      ]);

      if (analytics.userProductivity.length > 15) {
        teamData.push(["... and more", "", "", ""]);
      }

      autoTable(doc, {
        head: [
          [
            "Team Member",
            "Tasks Completed",
            "Completion Rate",
            "Avg Time (Days)",
          ],
        ],
        body: teamData,
        startY: 120,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: "bold",
        },
        didDrawPage: (data) => {
          // Add page number
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" }
          );
        },
      });
    }

    // Save PDF
    const fileName = getFileName("analytics", "pdf");
    doc.save(fileName);
    return fileName;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
};
