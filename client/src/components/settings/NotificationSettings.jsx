import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import DiscordWebhook from './DiscordWebhook';
import MattermostWebhook from './MattermostWebhook';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const NotificationSettings = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Paper sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          aria-label="notification settings tabs"
        >
          <Tab label="Discord" id="notification-tab-0" />
          <Tab label="Mattermost" id="notification-tab-1" />
        </Tabs>
      </Box>
      <TabPanel value={activeTab} index={0}>
        <DiscordWebhook projectId={projectId} />
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <MattermostWebhook projectId={projectId} />
      </TabPanel>
    </Paper>
  );
};

export default NotificationSettings;