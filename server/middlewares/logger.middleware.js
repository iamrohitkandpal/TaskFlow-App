export const requestLogger = (req, res, next) => {
  // Generate unique request ID
  const requestId = Math.random().toString(36).substring(2, 10);
  
  // Log request details
  const start = Date.now();
  console.log(`[${requestId}] ${req.method} ${req.originalUrl} [STARTED]`);
  
  // Capture the original end method
  const originalEnd = res.end;
  
  // Override the end method
  res.end = function(...args) {
    const duration = Date.now() - start;
    console.log(`[${requestId}] ${req.method} ${req.originalUrl} [COMPLETED] ${res.statusCode} (${duration}ms)`);
    
    // Call the original end method
    return originalEnd.apply(this, args);
  };
  
  next();
};