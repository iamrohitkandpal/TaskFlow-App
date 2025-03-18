import cron from 'node-cron';
import { processScheduledReports } from '../controllers/report.controller.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set up cron jobs for scheduled tasks
export const startCronJobs = () => {
  // Process scheduled reports every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled report cron job...');
    try {
      await processScheduledReports();
    } catch (error) {
      console.error('Error processing scheduled reports:', error);
    }
  });
  
  // Clean up temporary files daily at midnight
  cron.schedule('0 0 * * *', () => {
    console.log('Running cleanup job...');
    cleanupTemporaryFiles();
  });
  
  console.log('Cron jobs initialized');
};

// Clean up old temporary files (reports older than 24 hours)
const cleanupTemporaryFiles = () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const REPORTS_DIR = path.join(__dirname, '../tmp/reports');
  
  if (!fs.existsSync(REPORTS_DIR)) return;
  
  const files = fs.readdirSync(REPORTS_DIR);
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  
  files.forEach(file => {
    const filePath = path.join(REPORTS_DIR, file);
    const stats = fs.statSync(filePath);
    
    // Remove files older than 24 hours
    if (now - stats.mtime.getTime() > ONE_DAY_MS) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Removed old file: ${file}`);
      } catch (err) {
        console.error(`Failed to remove file ${file}:`, err);
      }
    }
  });
};

// Add to your server.js or app.js file
import reportRoutes from './routes/report.routes.js';
import { startCronJobs } from './services/cron.service.js';

// Add this route
app.use('/api/reports', reportRoutes);

// Start cron jobs after database connection
startCronJobs();

// Add this import to the imports section in App.jsx
import Reports from './pages/Reports';

// Add this route inside the Layout routes
<Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />