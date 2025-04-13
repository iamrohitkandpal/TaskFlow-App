const routeNotFound = (req, res, next) => {
    const error = new Error(`Route not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (error, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = error.message;

    // Handle common error types
    if (error.name === "CastError" && error.kind === "ObjectId") {
        statusCode = 404;
        message = "Resource not found";
    } else if (error.name === "ValidationError") {
        statusCode = 400;
        // Format validation errors in a useful way
        message = Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Authentication failed. Please log in again.";
    } else if (error.code === 11000) { // MongoDB duplicate key error
        statusCode = 409;
        const field = Object.keys(error.keyValue)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    }

    // Log detailed error in development/production
    const logLevel = statusCode >= 500 ? 'error' : 'warn';
    console[logLevel](`[${req.method}] ${req.originalUrl} - Error ${statusCode}: ${message}`);
    
    if (statusCode >= 500) {
        console.error(error.stack);
    }

    res.status(statusCode).json({
        status: false,
        message,
        errors: error.errors || undefined,
        // Only include stack in development
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
};

export { routeNotFound, errorHandler };