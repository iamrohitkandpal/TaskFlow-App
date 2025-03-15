import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { useSelector } from 'react-redux';
import { MdDelete, MdFilterList } from 'react-icons/md';

const SavedFilters = () => {
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { token } = useSelector(state => state.auth);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchSavedFilters();
  }, []);
  
  const fetchSavedFilters = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_BASE_URL}/search/filters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status) {
        setFilters(response.data.filters);
      } else {
        setError('Failed to load saved filters');
      }
    } catch (error) {
      console.error('Error fetching saved filters:', error);
      setError('An error occurred while fetching saved filters');
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilter = (filter) => {
    // Build URL with query parameters
    let searchUrl = `/search?q=${encodeURIComponent(filter.query || '')}`;
    
    // Add other filter parameters if they exist
    if (filter.filters) {
      Object.entries(filter.filters).forEach(([key, value]) => {
        if (value) {
          searchUrl += `&${key}=${encodeURIComponent(value)}`;
        }
      });
    }
    
    navigate(searchUrl);
  };
  
  const deleteFilter = async (filterId) => {
    try {
      await axios.delete(`${API_BASE_URL}/search/filters/${filterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state by removing the deleted filter
      setFilters(filters.filter(filter => filter._id !== filterId));
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  };
  
  if (loading) return <p className="text-center py-4">Loading saved filters...</p>;
  
  if (error) return <p className="text-center text-red-500 py-4">{error}</p>;
  
  if (filters.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-50 border border-gray-200 rounded-lg">
        <MdFilterList className="mx-auto text-4xl text-gray-400 mb-2" />
        <p className="text-gray-600">No saved filters yet</p>
        <p className="text-sm text-gray-500">Save your search queries for quick access</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium">Saved Filters</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {filters.map((filter) => (
          <li key={filter._id} className="px-4 py-3 hover:bg-gray-50">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => applyFilter(filter)}
                className="flex-1 text-left hover:text-blue-600 font-medium"
              >
                {filter.name}
              </button>
              <button 
                onClick={() => deleteFilter(filter._id)}
                className="text-red-500 hover:text-red-700 p-1"
                aria-label="Delete filter"
              >
                <MdDelete />
              </button>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {filter.query && <span>Query: "{filter.query}"</span>}
              
              {filter.filters && Object.entries(filter.filters).some(([_, value]) => value) && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {filter.filters.priority && (
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      Priority: {filter.filters.priority}
                    </span>
                  )}
                  {filter.filters.status && (
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      Status: {filter.filters.status}
                    </span>
                  )}
                  {/* Add other filter types as needed */}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SavedFilters;