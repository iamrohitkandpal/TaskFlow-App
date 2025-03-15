import {
  searchTasks
} from '../services/search.service.js';
import SavedFilter from '../models/saved-filter.model.js';
import Task from '../models/task.model.js';

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

// Save a search filter
export const saveSearchFilter = async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, query, filters } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        status: false, 
        message: 'Filter name is required' 
      });
    }
    
    // Check if a filter with the same name already exists
    const existingFilter = await SavedFilter.findOne({ 
      userId, 
      name 
    });
    
    if (existingFilter) {
      // Update existing filter
      existingFilter.query = query;
      existingFilter.filters = filters;
      await existingFilter.save();
      
      return res.status(200).json({
        status: true,
        message: 'Filter updated successfully',
        filter: existingFilter
      });
    } else {
      // Create new filter
      const newFilter = new SavedFilter({
        name,
        userId,
        query,
        filters
      });
      
      await newFilter.save();
      
      res.status(201).json({
        status: true,
        message: 'Filter saved successfully',
        filter: newFilter
      });
    }
  } catch (error) {
    console.error('Error saving search filter:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while saving search filter'
    });
  }
};

// Get all saved filters for a user
export const getSavedFilters = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const filters = await SavedFilter.find({ userId })
      .sort({ updatedAt: -1 });
    
    res.status(200).json({
      status: true,
      filters
    });
  } catch (error) {
    console.error('Error getting saved filters:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while getting saved filters'
    });
  }
};

// Delete a saved filter
export const deleteSavedFilter = async (req, res) => {
  try {
    const { userId } = req.user;
    const { filterId } = req.params;
    
    const filter = await SavedFilter.findOne({
      _id: filterId,
      userId
    });
    
    if (!filter) {
      return res.status(404).json({
        status: false,
        message: 'Filter not found'
      });
    }
    
    await filter.remove();
    
    res.status(200).json({
      status: true,
      message: 'Filter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting saved filter:', error);
    res.status(500).json({
      status: false,
      message: 'Server error while deleting saved filter'
    });
  }
};