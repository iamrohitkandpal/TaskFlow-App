import Task from '../models/task.model.js';
import User from '../models/user.model.js';
import mongoose from 'mongoose';

// Full-text search for tasks
export const searchTasks = async (query, options = {}) => {
  try {
    const { projectId, userId, limit = 20, page = 1, sort = { score: { $meta: 'textScore' } } } = options;
    
    // Base query using text search
    const searchQuery = { $text: { $search: query } };
    
    // Add filters
    if (projectId) {
      searchQuery.projectId = mongoose.Types.ObjectId(projectId);
    }
    
    if (userId) {
      searchQuery.$or = [
        { 'assignees': mongoose.Types.ObjectId(userId) },
        { 'createdBy': mongoose.Types.ObjectId(userId) }
      ];
    }
    
    // Don't include trashed items in search results
    searchQuery.isTrashed = { $ne: true };
    
    // Execute the search with pagination
    const skip = (page - 1) * limit;
    
    const tasks = await Task.find(
      searchQuery,
      { score: { $meta: 'textScore' } } // Add score to results
    )
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('assignees', 'name email avatar')
    .populate('createdBy', 'name email avatar');
    
    // Get total count for pagination
    const totalCount = await Task.countDocuments(searchQuery);
    
    return {
      tasks,
      page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount
    };
  } catch (error) {
    console.error('Error in searchTasks service:', error);
    throw error;
  }
};

// Save a search filter
export const saveSearchFilter = async (userId, filterData) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.savedSearches) {
      user.savedSearches = [];
    }
    
    // Check if filter with same name exists
    const existingFilterIndex = user.savedSearches.findIndex(
      filter => filter.name === filterData.name
    );
    
    if (existingFilterIndex >= 0) {
      // Update existing filter
      user.savedSearches[existingFilterIndex] = {
        ...user.savedSearches[existingFilterIndex],
        ...filterData,
        updatedAt: new Date()
      };
    } else {
      // Add new filter
      user.savedSearches.push({
        ...filterData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    await user.save();
    return user.savedSearches;
  } catch (error) {
    console.error('Error saving search filter:', error);
    throw error;
  }
};

// Get user's saved search filters
export const getUserSearchFilters = async (userId) => {
  try {
    const user = await User.findById(userId).select('savedSearches');
    return user?.savedSearches || [];
  } catch (error) {
    console.error('Error getting user search filters:', error);
    throw error;
  }
};

// Delete a saved search filter
export const deleteSearchFilter = async (userId, filterId) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.savedSearches) {
      throw new Error('User or saved searches not found');
    }
    
    user.savedSearches = user.savedSearches.filter(
      filter => filter._id.toString() !== filterId
    );
    
    await user.save();
    return user.savedSearches;
  } catch (error) {
    console.error('Error deleting search filter:', error);
    throw error;
  }
};