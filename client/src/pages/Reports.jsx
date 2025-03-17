import React from 'react';
import { Box, Typography } from '@mui/material';
import Title from '../components/Title';
import ReportManager from '../components/reports/ReportManager';

const Reports = () => {
  return (
    <Box>
      <Title title="Reports" />
      <Box sx={{ mt: 2 }}>
        <ReportManager />
      </Box>
    </Box>
  );
};

export default Reports;