import React from 'react';
import GitHubIntegration from '../components/integrations/GitHubIntegration';
import GitLabIntegration from '../components/integrations/GitLabIntegration';
import CalendarIntegration from '../components/integrations/CalendarIntegration';

const IntegrationsSettings = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Integrations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GitHubIntegration />
        <GitLabIntegration />
        <CalendarIntegration />
      </div>
      
      <div className="mt-8 bg-blue-50 p-4 rounded-md border border-blue-100">
        <h3 className="text-lg font-medium text-blue-800 mb-2">How integrations work</h3>
        <p className="text-sm text-blue-700">
          Connecting these integrations allows TaskFlow to sync with your GitHub repositories, 
          GitLab projects, and calendars. You can link specific tasks to commits and issues, 
          receive notifications when changes occur, and sync your task deadlines with your calendar.
        </p>
      </div>
    </div>
  );
};

export default IntegrationsSettings;