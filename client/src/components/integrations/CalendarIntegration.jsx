import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/constants';

const CalendarIntegration = () => {
  const [connected, setConnected] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    serverUrl: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    // Check if calendar is already connected
    const checkConnection = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/calendar/user`);
        
        if (response.data && response.data.length > 0) {
          setConnected(true);
          setCalendars(response.data);
        }
      } catch (err) {
        console.error('Error checking calendar connection:', err);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnect = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${API_BASE_URL}/calendar/caldav/connect`, formData);
      
      // Fetch calendars after connection
      const response = await axios.get(`${API_BASE_URL}/calendar/user`);
      setCalendars(response.data);
      setConnected(true);
      
      // Reset form
      setFormData({
        serverUrl: '',
        username: '',
        password: '',
      });
      
    } catch (err) {
      console.error('Error connecting to CalDAV server:', err);
      setError(err.response?.data?.message || 'Failed to connect to calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <FaCalendarAlt className="text-2xl mr-2 text-indigo-600" />
        <h3 className="text-lg font-medium">Calendar Integration</h3>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
          {error}
        </div>
      )}
      
      {!connected ? (
        <form onSubmit={handleConnect}>
          <div className="mb-3">
            <label htmlFor="serverUrl" className="block text-sm font-medium text-gray-700 mb-1">
              CalDAV Server URL
            </label>
            <input
              type="url"
              id="serverUrl"
              name="serverUrl"
              value={formData.serverUrl}
              onChange={handleChange}
              required
              placeholder="https://example.com/caldav/"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {loading ? 'Connecting...' : 'Connect Calendar'}
          </button>
        </form>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              Connected
            </span>
          </div>
          
          <h4 className="font-medium mb-2 mt-4">Available Calendars</h4>
          {calendars.length > 0 ? (
            <ul className="divide-y">
              {calendars.map((calendar, index) => (
                <li key={index} className="py-2 flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: calendar.color || '#4f46e5' }} />
                  <span>{calendar.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No calendars found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarIntegration;