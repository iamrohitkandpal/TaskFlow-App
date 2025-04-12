import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
// If expressJwt is used elsewhere, keep it, otherwise remove
import expressJwt from 'express-jwt';

/**
 * Middleware to protect routes requiring authentication
 * Verifies JWT token from cookies and attaches user info to request
 */
const protectedRoute = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await User.findById(decoded.userId).select(
          "isAdmin email"
        );

        if (!result) {
          return res
            .status(401)
            .json({ status: false, message: "User not found" });
        }

        req.user = {
          userId: decoded.userId,
          isAdmin: result.isAdmin,
          email: result.email,
        };

        return next();
      } catch (error) {
        console.error("Token verification error:", error.message);
        return res
          .status(401)
          .json({ status: false, message: "Not Authorized, Invalid Token" });
      }
    } else {
      return res
        .status(401)
        .json({ status: false, message: "Not Authorized, Login Again" });
    }
  } catch (error) {
    console.error("Error in protectedRoute middleware:", error.message);
    return res
      .status(401)
      .json({ status: false, message: "Not Authorized, Login Again" });
  }
};

/**
 * Middleware to restrict routes to admin users only
 * Requires protectedRoute middleware to run first
 */
const isAdminRoute = async (req, res, next) => {
  try {
    if (req.user && req.user.isAdmin) {
      return next();
    } else {
      return res
        .status(403)
        .json({ status: false, message: "Not Authorized, Admin Only" });
    }
  } catch (error) {
    console.error("Error in isAdminRoute middleware:", error);
    return res
      .status(500)
      .json({ status: false, message: "Server Error" });
  }
};

/**
 * Middleware to check if user has required role(s)
 * @param {Array<string>} roles - Array of roles allowed to access the route
 * @returns {Function} Express middleware function
 */
const checkRole = (roles) => {
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

// Export all middleware functions together
export { protectedRoute, isAdminRoute, checkRole };