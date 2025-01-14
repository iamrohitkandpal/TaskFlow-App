import express from "express";
import { isAdminRoute, protectedRoute } from "../middlewares/auth.middleware.js";
import { activateUserProfile, changeUserPassword, deleteUserProfile, getNotificationsList, getTeamList, loginUser, logoutUser, markNotificationRead, registerUser, updateUserProfile } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.get("/get-team", protectedRoute, isAdminRoute, getTeamList);
router.get("/notifications", protectedRoute, getNotificationsList);

router.put("/profile", protectedRoute, updateUserProfile);
router.put("/read-noti", protectedRoute, markNotificationRead);
router.put("/change-password", protectedRoute, changeUserPassword);

// ADMIN ROUTES
router
  .route("/:id")
  .put(protectedRoute, isAdminRoute, activateUserProfile)
  .delete(protectedRoute, isAdminRoute, deleteUserProfile);


export default router;