import mongoose from 'mongoose';

/**
 * Safe database query executor with error handling
 * @param {Function} queryFn - MongoDB query function to execute
 * @param {String} errorMessage - Custom error message
 * @returns {Promise} - Query result or throws standardized error
 */
export const safeQuery = async (queryFn, errorMessage) => {
  try {
    const result = await queryFn();
    return result;
  } catch (error) {
    console.error(`Database error: ${errorMessage}\n`, error);
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.statusCode = 500;
    throw enhancedError;
  }
};

/**
 * Ensures user is authenticated and userId exists
 * @param {Object} req - Express request object
 * @returns {String} userId - The validated user ID
 */
export const ensureUserId = (req) => {
  if (!req.user || !req.user.userId) {
    const error = new Error('Authentication required: User ID not found');
    error.statusCode = 401;
    throw error;
  }
  return req.user.userId;
};

/**
 * Async handler wrapper for Express controllers
 * @param {Function} fn - Controller function to wrap
 * @returns {Function} - Error-handling middleware
 */
export const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error(`Controller error: ${error.message}\n`, error.stack);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        status: false,
        message: error.message || 'Server error',
        error: process.env.NODE_ENV === 'development' ? {
          stack: error.stack,
          details: error.originalError?.message
        } : undefined
      });
    }
  };
};

/**
 * Validate MongoDB ID
 * @param {String} id - ID to validate
 * @param {String} entityName - Name of entity for error message
 * @returns {Boolean} - True if valid, throws error if invalid
 */
export const validateId = (id, entityName = 'resource') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${entityName} ID format`);
    error.statusCode = 400;
    throw error;
  }
  return true;
};