import ical from 'ical-generator';
import axios from 'axios';
import Task from '../models/task.model.js';
import User from '../models/user.model.js';

// Controller to connect user's CalDAV account
export const connectCalDAV = async (req, res) => {
  try {
    const { url, username, password } = req.body;
    const { userId } = req.user;

    if (!url || !username || !password) {
      return res.status(400).json({
        status: false,
        message: 'CalDAV server URL, username, and password are required'
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }

    // Test connection to CalDAV server with a simple request
    try {
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      
      // Attempt to access the server with PROPFIND
      const response = await axios({
        method: 'PROPFIND',
        url: url,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Depth': '1',
          'Content-Type': 'application/xml'
        },
        validateStatus: status => status < 500
      });

      if (response.status >= 400) {
        return res.status(400).json({
          status: false,
          message: 'Failed to connect to CalDAV server. Check credentials and URL.'
        });
      }
      
      // Store CalDAV details in user document
      user.calendar = {
        type: 'caldav',
        url,
        username,
        password, // In production, encrypt this
        calendars: [{
          id: url,
          name: 'Default Calendar'
        }]
      };
      
      await user.save();
      
      res.status(200).json({
        status: true,
        message: 'CalDAV account connected successfully',
        calendars: user.calendar.calendars
      });
    } catch (error) {
      console.error('Error connecting to CalDAV server:', error);
      return res.status(400).json({
        status: false,
        message: 'Failed to connect to CalDAV server. Check credentials and URL.'
      });
    }
  } catch (error) {
    console.error('Error in connectCalDAV controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while connecting to CalDAV'
    });
  }
};

// Controller to update task deadline in CalDAV calendar
export const syncTaskToCalendar = async (req, res) => {
  try {
    const { taskId, calendarId } = req.body;
    const { userId } = req.user;

    // Find the user with calendar data
    const user = await User.findById(userId);
    if (!user || !user.calendar) {
      return res.status(400).json({
        status: false,
        message: 'No calendar configuration found for user'
      });
    }

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        status: false,
        message: 'Task not found'
      });
    }

    if (!task.dueDate) {
      return res.status(400).json({
        status: false,
        message: 'Task has no due date to sync'
      });
    }

    // Connect to CalDAV server
    const client = createClient({
      server: user.calendar.url,
      credentials: {
        username: user.calendar.username,
        password: user.calendar.password
      }
    });

    // Create iCalendar event
    const calendar = ical();
    const event = calendar.createEvent({
      start: new Date(task.dueDate),
      end: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000), // 1 hour duration
      summary: `[TaskFlow] ${task.title}`,
      description: task.description || '',
      url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/task/${task._id}`
    });

    // Create event on CalDAV server
    const selectedCalendar = await client.getCalendar(calendarId);
    const result = await client.createCalendarObject(selectedCalendar, {
      filename: `taskflow-${task._id}.ics`,
      data: calendar.toString(),
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8'
      }
    });

    // Store calendar event ID in task
    task.calendarEventId = result.url;
    task.calendarSync = {
      synced: true,
      provider: 'caldav',
      calendarId,
      lastSynced: new Date()
    };
    
    await task.save();

    res.status(200).json({
      status: true,
      message: 'Task synced to calendar successfully',
      task
    });
  } catch (error) {
    console.error('Error in syncTaskToCalendar controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while syncing task to calendar'
    });
  }
};

// Controller to get user's calendars
export const getUserCalendars = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const user = await User.findById(userId);
    if (!user || !user.calendar) {
      return res.status(404).json({
        status: false,
        message: 'No calendar configuration found'
      });
    }
    
    res.status(200).json({
      status: true,
      message: 'Calendars retrieved successfully',
      type: user.calendar.type,
      calendars: user.calendar.calendars
    });
  } catch (error) {
    console.error('Error in getUserCalendars controller:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while getting calendars'
    });
  }
};