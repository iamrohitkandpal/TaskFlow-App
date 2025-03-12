import axios from 'axios';
import ical from 'ical-generator';
import icalParser from 'ical-parser';
import Task from '../models/task.model.js';
import mongoose from 'mongoose';

// Generate iCal calendar from task deadlines
export const generateICalendar = async (userId) => {
  try {
    // Create calendar object
    const calendar = ical({ name: 'TaskFlow Deadlines' });
    
    // Get user's tasks
    const query = { isTrashed: false };
    if (userId) {
      query.$or = [
        { assignees: mongoose.Types.ObjectId(userId) },
        { createdBy: mongoose.Types.ObjectId(userId) }
      ];
    }
    
    // Only include tasks with deadlines
    query.dueDate = { $exists: true, $ne: null };
    
    const tasks = await Task.find(query)
      .select('title description dueDate priority')
      .lean();
    
    // Add each task as calendar event
    tasks.forEach(task => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        
        // Set priority map for CalDAV
        const priorityMap = {
          high: 1,    // High priority
          medium: 5,  // Medium priority
          normal: 5,  // Medium priority
          low: 9      // Low priority
        };
        
        calendar.createEvent({
          start: dueDate,
          end: new Date(dueDate.getTime() + 30 * 60000), // 30 minutes
          summary: task.title,
          description: task.description,
          priority: priorityMap[task.priority] || 5
        });
      }
    });
    
    return calendar.toString();
  } catch (error) {
    console.error('Error generating iCalendar:', error);
    throw error;
  }
};

// Subscribe to external CalDAV calendar
export const subscribeToCalDAVCalendar = async (url, username, password) => {
  try {
    // Fetch calendar data with authentication if provided
    const response = await axios.get(url, {
      headers: username && password ? {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
      } : {},
      responseType: 'text'
    });
    
    // Parse iCal data
    const calendar = icalParser.parseString(response.data);
    
    // Extract events and return
    return calendar;
  } catch (error) {
    console.error('Error subscribing to CalDAV calendar:', error);
    throw error;
  }
};

// Sync tasks from CalDAV calendar
export const importTasksFromCalendar = async (calendarData, userId) => {
  try {
    const importedTasks = [];
    const errors = [];
    
    for (const event of calendarData.events) {
      // Only process events in the future
      if (new Date(event.start) < new Date()) {
        continue;
      }
      
      try {
        // Create task from calendar event
        const newTask = new Task({
          title: event.summary,
          description: event.description,
          dueDate: event.start,
          priority: event.priority === 1 ? 'high' : (event.priority === 9 ? 'low' : 'medium'),
          createdBy: userId,
          assignees: [userId]
        });
        
        await newTask.save();
        importedTasks.push(newTask);
      } catch (err) {
        console.error('Error importing task from calendar event:', err);
        errors.push(event.summary);
      }
    }
    
    return { 
      success: true, 
      importedCount: importedTasks.length, 
      errors 
    };
  } catch (error) {
    console.error('Error importing tasks from calendar:', error);
    throw error;
  }
};