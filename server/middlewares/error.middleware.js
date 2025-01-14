const routeNotFound = (req, res, next) => {
    const error = new Error(`Route not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

const errorHandler = (error, req, res, next) => {
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = error.message;

    if(error.name === "CastError" && error.kind === "ObjectId") {
        statusCode = 404;
        message = "Resource Not Found";
    }

    res.status(statusCode).json({
        message: message,
        stack: process.env.NODE_ENV === 'development'? error.stack : null
    });
};

export { routeNotFound, errorHandler };