import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/constants';
import { useSelector } from 'react-redux';
import { MdSearch, MdSave, MdClose, MdHistory } from 'react-icons/md';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [filterName, setFilterName] = useState('');
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { token } = useSelector(state => state.auth);
  
  // Fetch saved filters on component mount
  useEffect(() => {
    const fetchSavedFilters = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/search/filters`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.status) {
          setSavedFilters(response.data.filters);
        }
      } catch (error) {
        console.error('Error fetching saved filters:', error);
      }
    };
    
    if (token) {
      fetchSavedFilters();
    }
  }, [token]);
  
  // Handle clicks outside of the search component
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Debounced search function
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query]);
  
  const performSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/search/tasks`, {
        params: { query, limit: 5 },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status) {
        setResults(response.data.tasks);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowResults(false);
    }
  };
  
  const saveFilter = async () => {
    if (!filterName.trim() || !query.trim()) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/search/filters`, {
        name: filterName,
        query: query
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status) {
        setSavedFilters(response.data.filters);
        setShowSaveFilter(false);
        setFilterName('');
      }
    } catch (error) {
      console.error('Error saving filter:', error);
    }
  };
  
  const applyFilter = (filter) => {
    setQuery(filter.query);
    navigate(`/search?q=${encodeURIComponent(filter.query)}`);
    setShowResults(false);
  };
  
  const deleteFilter = async (filterId, e) => {
    e.stopPropagation();
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/search/filters/${filterId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status) {
        setSavedFilters(response.data.filters);
      }
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  };
  
  return (
    <div className="relative" ref={searchRef}>
      {/* Search input */}
      <form onSubmit={handleSearchSubmit} className="flex items-center">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MdSearch className="text-gray-500 text-lg" />
          </div>
          <input
            type="search"
            className="w-full pl-10 pr-20 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search tasks, projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && setShowResults(true)}
          />
          <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 flex items-center">
            {query && (
              <button
                type="button"
                className="mr-1 text-gray-400 hover:text-gray-600"
                onClick={() => setQuery('')}
              >
                <MdClose />
              </button>
            )}
            {query && !showSaveFilter && (
              <button
                type="button"
                className="text-blue-500 hover:text-blue-700"
                onClick={() => setShowSaveFilter(true)}
                title="Save this search"
              >
                <MdSave />
              </button>
            )}
          </div>
        </div>
        <button type="submit" className="sr-only">Search</button>
      </form>
      
      {/* Search results dropdown */}
      {showResults && (
        <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {/* Saved search form */}
          {showSaveFilter && (
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Name this search filter"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
                <button
                  className="ml-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  onClick={saveFilter}
                >
                  Save
                </button>
                <button
                  className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  onClick={() => setShowSaveFilter(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Saved filters section */}
          {savedFilters.length > 0 && (
            <div className="p-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <MdHistory className="mr-1" /> Saved searches
              </h3>
              <ul className="space-y-1">
                {savedFilters.map(filter => (
                  <li 
                    key={filter._id} 
                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => applyFilter(filter)}
                  >
                    <span className="text-gray-800">{filter.name}</span>
                    <button
                      className="text-gray-400 hover:text-red-500"
                      onClick={(e) => deleteFilter(filter._id, e)}
                    >
                      <MdClose />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Search results */}
          {isSearching ? (
            <div className="p-3 text-center text-gray-500">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              <ul className="divide-y divide-gray-200">
                {results.map(task => (
                  <li key={task._id} className="p-3 hover:bg-gray-50">
                    <a href={`/tasks/${task._id}`} className="block">
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {task.description || 'No description provided'}
                      </p>
                      <div className="flex items-center mt-1">
                        <span className={`inline-block h-2 w-2 rounded-full mr-1 ${
                          task.priority === 'high' ? 'bg-red-500' : 
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></span>
                        <span className="text-xs text-gray-600 capitalize">{task.priority}</span>
                        <span className="mx-1 text-gray-300">•</span>
                        <span className="text-xs text-gray-600 capitalize">{task.status}</span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
              <div className="p-2 border-t border-gray-200">
                <button
                  className="w-full py-2 text-sm text-blue-600 hover:text-blue-800"
                  onClick={handleSearchSubmit}
                >
                  See all results
                </button>
              </div>
            </>
          ) : query.length >= 2 ? (
            <div className="p-3 text-center text-gray-500">
              No results found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;