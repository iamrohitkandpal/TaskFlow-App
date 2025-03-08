import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const protectedRoute = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fix: Use decoded.userId instead of decoded.id
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

        next();
      } catch (error) {
        console.log("Token verification error:", error.message);
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
    console.log("Error in protectedRoute middleware:", error.message);
    return res
      .status(401)
      .json({ status: false, message: "Not Authorized, Login Again" });
  }
};

const isAdminRoute = async (req, res, next) => {
  try {
    if (req.user && req.user.isAdmin) {
      next();
    }
  } catch (error) {
    return res
      .status(401)
      .json({ status: false, message: "Not Authorized, Admin Only" });
  }
};

export { protectedRoute, isAdminRoute };