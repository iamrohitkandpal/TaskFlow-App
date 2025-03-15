import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';
import { useSelector } from 'react-redux';
import { MdSearch, MdFilterList, MdSave } from 'react-icons/md';
import TaskCard from '../components/task/TaskCard';
import Pagination from '../components/common/Pagination';
import Title from '../components/Title';
import SavedFilters from '../components/search/SavedFilters';

const SearchResults = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  
  // Search filters
  const [filters, setFilters] = useState({
    priority: '',
    status: '',
    assignee: '',
    projectId: ''
  });
  
  const { token } = useSelector(state => state.auth);
  
  // Fetch search results when query, page or filters change
  useEffect(() => {
    if (query.trim()) {
      performSearch();
    } else {
      setResults([]);
      setTotalPages(1);
    }
  }, [query, page, filters]);
  
  // Update URL when query changes
  useEffect(() => {
    if (query !== initialQuery) {
      const newUrl = query.trim() 
        ? `${location.pathname}?q=${encodeURIComponent(query)}` 
        : location.pathname;
        
      window.history.replaceState(null, '', newUrl);
    }
  }, [query, initialQuery, location.pathname]);
  
  const performSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build search parameters
      const params = {
        query,
        page,
        limit: 10
      };
      
      // Add filters if they exist
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params[key] = value;
        }
      });
      
      const response = await axios.get(`${API_BASE_URL}/search/tasks`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status) {
        setResults(response.data.tasks);
        setTotalPages(response.data.totalPages);
        setTotalResults(response.data.totalCount);
      } else {
        setError('Failed to load search results');
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setError('An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    performSearch();
  };
  
  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
    setPage(1); // Reset to first page when filters change
  };
  
  const clearFilters = () => {
    setFilters({
      priority: '',
      status: '',
      assignee: '',
      projectId: ''
    });
  };
  
  const saveCurrentFilter = async () => {
    if (!filterName.trim()) return;
    
    try {
      await axios.post(`${API_BASE_URL}/search/filters`, {
        name: filterName,
        query,
        filters
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowSaveFilter(false);
      setFilterName('');
    } catch (error) {
      console.error('Error saving filter:', error);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <Title title="Search Results" />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Search sidebar with saved filters - 1/4 width on medium screens */}
        <div className="md:col-span-1">
          <SavedFilters />
        </div>
        
        {/* Search results - 3/4 width on medium screens */}
        <div className="md:col-span-3">
          {/* Existing search form and results */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MdSearch className="text-gray-500 text-lg" />
              </div>
              <input
                type="search"
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search tasks, projects..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={isLoading || !query.trim()}
              >
                Search
              </button>
              <button 
                type="button" 
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
                onClick={() => setShowFilters(!showFilters)}
              >
                <MdFilterList className="mr-1" /> Filters
              </button>
              {query && (
                <button 
                  type="button" 
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                  onClick={() => setShowSaveFilter(true)}
                >
                  <MdSave className="mr-1" /> Save
                </button>
              )}
            </div>
          </form>
          
          {/* Save filter dialog */}
          {showSaveFilter && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <h3 className="text-md font-medium text-gray-800 mb-2">Save this search</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a name for this search"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={saveCurrentFilter}
                >
                  Save
                </button>
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  onClick={() => setShowSaveFilter(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Filter section */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="flex justify-between mb-3">
                <h3 className="text-md font-medium text-gray-800">Filter results</h3>
                <button 
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Priority filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    name="priority"
                    value={filters.priority}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                
                {/* Status filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All statuses</option>
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                {/* Assignee filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    name="assignee"
                    value={filters.assignee}
                    onChange={handleFilterChange}
                    placeholder="Filter by assignee"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Add more filters as needed */}
              </div>
            </div>
          )}
          
          {/* Search results */}
          <div className="mt-6">
            {isLoading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : results.length > 0 ? (
              <div>
                <p className="mb-4 text-sm text-gray-600">
                  Showing {results.length} of {totalResults} results
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(newPage) => setPage(newPage)}
                />
              </div>
            ) : (
              <p>No results found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;