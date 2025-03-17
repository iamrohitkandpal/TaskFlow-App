import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Paper, Typography, Box, Alert, CircularProgress, Divider, Tabs, Tab } from '@mui/material';
import Title from '../components/Title';
import GanttChart from '../components/gantt/GanttChart';
import CriticalPathInfo from '../components/gantt/CriticalPathInfo';
import TaskDependenciesPanel from '../components/gantt/TaskDependenciesPanel';
import { useGetProjectQuery } from '../redux/slices/api/projectApiSlice';

const ProjectTimeline = () => {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState(0);
  const { data: project, isLoading, error } = useGetProjectQuery(projectId);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Error loading project: {error.message || 'Unknown error'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Title title={`Project Timeline: ${project?.name || 'Project'}`} />
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1">
          View and manage your project timeline, including task dependencies and critical path analysis.
        </Typography>
      </Paper>
      
      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="timeline tabs">
          <Tab label="Gantt Chart" />
          <Tab label="Critical Path" />
          <Tab label="Dependencies" />
        </Tabs>
      </Box>
      
      <Box sx={{ display: activeTab === 0 ? 'block' : 'none' }}>
        <GanttChart projectId={projectId} />
      </Box>
      
      <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
        <CriticalPathInfo projectId={projectId} />
      </Box>
      
      <Box sx={{ display: activeTab === 2 ? 'block' : 'none' }}>
        <TaskDependenciesPanel projectId={projectId} />
      </Box>
    </Box>
  );
};

export default ProjectTimeline;