import express from "express";
import { isAdminRoute, protectedRoute } from "../middlewares/auth.middleware.js";
import { activateUserProfile, changeUserPassword, deleteUserProfile, getNotificationsList, getTeamList, loginUser, logoutUser, markNotificationRead, registerUser, updateUserProfile } from "../controllers/user.controller.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", protectedRoute, getProfile);
router.post("/logout", protectedRoute, logoutUser);
router.put("/profile", protectedRoute, changeProfile);
router.put("/change-password", protectedRoute, changePassword);

router.get("/get-team", protectedRoute, getTeamList);
router.get("/notifications", protectedRoute, getNotificationsList);

router.put("/read-noti", protectedRoute, markNotificationRead);

router.put('/:userId/skills', protectedRoute, updateUserSkills);

// ADMIN ROUTES
router
  .route("/:id")
  .put(protectedRoute, isAdminRoute, activateUserProfile)
  .delete(protectedRoute, isAdminRoute, deleteUserProfile);

export default router;