import express from "express";
import { 
    updateUsername, 
    changePassword, 
    updateAvatar, 
    deleteAvatar, 
    getProfile,
    updatePhone
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protectRoute);

// Get current user profile
router.get("/profile", getProfile);

// Update username
router.put("/update-username", updateUsername);

// Update phone
router.put("/update-phone", updatePhone);

// Change password
router.put("/change-password", changePassword);

// Update avatar
router.put("/update-avatar", updateAvatar);

// Delete avatar (revert to default)
router.delete("/delete-avatar", deleteAvatar);

export default router;
