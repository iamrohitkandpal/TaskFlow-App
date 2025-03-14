import {
  searchTasks,
  saveSearchFilter,
  getUserSearchFilters,
  deleteSearchFilter
} from '../services/search.service.js';

// Controller for full-text search
export const searchTasksController = async (req, res) => {
  try {
    const { query, projectId, limit, page, sort } = req.query;
    const { userId } = req.user;
    
    if (!query) {
      return res.status(400).json({
        status: false,
        message: 'Search query is required'
      });
    }
    
    const options = {
      projectId,
      userId,
      limit: limit ? parseInt(limit) : 20,
      page: page ? parseInt(page) : 1
    };
    
    if (sort) {
      try {
        options.sort = JSON.parse(sort);
      } catch (e) {
        // Use default sort if parsing fails
      }
    }
    
    const results = await searchTasks(query, options);
    
    res.status(200).json({
      status: true,
      message: 'Search completed successfully',
      ...results
    });
  } catch (error) {
    console.error('Error in searchTasksController:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while performing search'
    });
  }
};

// Controller to save a search filter
export const saveSearchFilterController = async (req, res) => {
  try {
    const { userId } = req.user;
    const filterData = req.body;
    
    if (!filterData.name || !filterData.query) {
      return res.status(400).json({
        status: false,
        message: 'Filter name and query are required'
      });
    }
    
    const savedFilters = await saveSearchFilter(userId, filterData);
    
    res.status(200).json({
      status: true,
      message: 'Search filter saved successfully',
      filters: savedFilters
    });
  } catch (error) {
    console.error('Error in saveSearchFilterController:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while saving search filter'
    });
  }
};

// Controller to get user's saved search filters
export const getUserSearchFiltersController = async (req, res) => {
  try {
    const { userId } = req.user;
    const filters = await getUserSearchFilters(userId);
    
    res.status(200).json({
      status: true,
      filters
    });
  } catch (error) {
    console.error('Error in getUserSearchFiltersController:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while retrieving search filters'
    });
  }
};

// Controller to delete a saved search filter
export const deleteSearchFilterController = async (req, res) => {
  try {
    const { userId } = req.user;
    const { filterId } = req.params;
    
    if (!filterId) {
      return res.status(400).json({
        status: false,
        message: 'Filter ID is required'
      });
    }
    
    const updatedFilters = await deleteSearchFilter(userId, filterId);
    
    res.status(200).json({
      status: true,
      message: 'Search filter deleted successfully',
      filters: updatedFilters
    });
  } catch (error) {
    console.error('Error in deleteSearchFilterController:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while deleting search filter'
    });
  }
};