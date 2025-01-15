import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const protectedRoute = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const result = await User.findById(decoded.userId).select(
        "isAdmin email"
      );
      req.user = {
        userId: decoded.userId,
        isAdmin: result.isAdmin,
        email: result.email,
      };

      next();
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