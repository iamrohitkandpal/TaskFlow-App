import nodemailer from 'nodemailer';
import config from '../config/config.js';
import { createReportPdf, createReportExcel } from './report-generator.service.js';

// Create a transporter
const createTransporter = () => {
  // For production
  if (config.EMAIL_HOST && config.EMAIL_USER && config.EMAIL_PASSWORD) {
    return nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT || 587,
      secure: config.EMAIL_SECURE === 'true',
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASSWORD
      }
    });
  }
  
  // For development/testing with Ethereal
  return new Promise((resolve, reject) => {
    nodemailer.createTestAccount()
      .then(testAccount => {
        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        resolve(transporter);
      })
      .catch(error => {
        console.error('Failed to create test email account:', error);
        reject(error);
      });
  });
};

// Send a report email
export const sendReportEmail = async ({ recipients, reportType, format, title, data, senderName }) => {
  try {
    const transporter = await createTransporter();
    
    // Generate report file
    let attachmentPath, attachmentFilename;
    if (format === 'pdf') {
      attachmentPath = await createReportPdf(reportType, data, title);
      attachmentFilename = `${title.replace(/\s+/g, '_')}_Report.pdf`;
    } else if (format === 'excel' || format === 'csv') {
      attachmentPath = await createReportExcel(reportType, data, title, format);
      attachmentFilename = `${title.replace(/\s+/g, '_')}_Report.${format}`;
    }
    
    // Format report type name
    const reportTypeName = reportType === 'tasks' ? 'Task Report' : 
                          reportType === 'project' ? 'Project Report' : 
                          'Analytics Report';
    
    const formatName = format.toUpperCase();
    
    const mailOptions = {
      from: `"TaskFlow" <${config.EMAIL_USER || 'noreply@taskflow.com'}>`,
      to: recipients.join(', '),
      subject: `TaskFlow: ${reportTypeName} - ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a90e2;">TaskFlow Report</h2>
          <p>Dear recipient,</p>
          <p>Please find attached your <strong>${reportTypeName}</strong> in ${formatName} format.</p>
          <p>This report was automatically generated as scheduled by ${senderName}.</p>
          <p style="margin-top: 20px;">Best regards,<br>TaskFlow Team</p>
        </div>
      `,
      attachments: [
        {
          filename: attachmentFilename,
          path: attachmentPath
        }
      ]
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  } catch (error) {
    console.error('Error sending report email:', error);
    throw error;
  }
};