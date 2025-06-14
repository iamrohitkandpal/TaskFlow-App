import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { asyncHandler } from '../utils/controllerUtils.js';

export const protectedRoute = asyncHandler(async (req, res, next) => {
  // Get token from cookie or Authorization header
  let token = req.cookies?.token;
  
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({
      status: false,
      message: 'Not authorized, no token'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');
    next();
  } catch (error) {
    return res.status(401).json({
      status: false, 
      message: 'Not authorized, token failed'
    });
  }
});

export const isAdminRoute = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
  
  if (!req.user.isAdmin) {
    const error = new Error('Admin privileges required');
    error.statusCode = 403;
    throw error;
  }
  
  next();
});

/**
 * Middleware to check if user has required role(s)
 * @param {Array<string>} roles - Array of roles allowed to access the route
 * @returns {Function} Express middleware function
 */
export const checkRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      
      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({
          status: false,
          message: 'Access denied'
        });
      }
      
      return next();
    } catch (error) {
      console.error('Error in checkRole middleware:', error);
      return res.status(500).json({
        status: false,
        message: 'Server error'
      });
    }
  };
};