/**
 * Middleware to standardize API responses
 */
export const standardizeResponse = (req, res, next) => {
  // Store original res.json function
  const originalJson = res.json;
  
  // Override res.json to standardize responses
  res.json = function(data) {
    // If response is already standardized, don't modify it
    if (data && (data.status === true || data.status === false)) {
      return originalJson.call(this, data);
    }
    
    // Standardize successful responses
    const standardized = {
      status: true,
      data
    };
    
    return originalJson.call(this, standardized);
  };
  
  // Add standardized error response method
  res.errorJson = function(message, statusCode = 400) {
    const errorResponse = {
      status: false,
      message: message || 'An error occurred'
    };
    
    this.status(statusCode);
    return originalJson.call(this, errorResponse);
  };
  
  next();
};

// Add application to index.js
// app.use(standardizeResponse);