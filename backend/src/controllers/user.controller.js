import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';

/**
 * Update username (fullName)
 * PUT /user/update-username
 */
export const updateUsername = async (req, res) => {
    try {
        const { fullName } = req.body;
        const userId = req.user._id;

        // Validation: Not empty
        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ message: "Username cannot be empty" });
        }

        const trimmedName = fullName.trim();

        // Validation: Minimum 3 characters
        if (trimmedName.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters long" });
        }

        // Validation: Check if username is unique (case-insensitive)
        const existingUser = await User.findOne({
            fullName: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
            _id: { $ne: userId }
        });

        if (existingUser) {
            return res.status(400).json({ message: "Username already taken" });
        }

        // Update username
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fullName: trimmedName },
            { new: true }
        ).select('-password -chatKeyPassword');

        res.status(200).json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            phoneNumber: updatedUser.phoneNumber,
            email: updatedUser.email,
            profilePic: updatedUser.profilePic,
            createdAt: updatedUser.createdAt,
        });
    } catch (error) {
        console.log("Error in updateUsername controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Change password
 * PUT /user/change-password
 */
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user._id;

        // Validation: All fields required
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validation: New password minimum 6 characters
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters long" });
        }

        // Validation: Confirm password matches
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New password and confirm password do not match" });
        }

        // Get user with password field
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.log("Error in changePassword controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Update phone number
 * PUT /user/update-phone
 */
export const updatePhone = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const userId = req.user._id;

        // Validation: Not empty
        if (!phoneNumber || !phoneNumber.trim()) {
            return res.status(400).json({ message: "Phone number cannot be empty" });
        }

        const trimmedPhone = phoneNumber.trim().replace(/\D/g, "");

        // Validation: Valid phone number format (7-15 digits)
        if (!/^\d{7,15}$/.test(trimmedPhone)) {
            return res.status(400).json({ message: "Please enter a valid phone number" });
        }

        // Update phone number
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { phoneNumber: trimmedPhone },
            { new: true }
        ).select('-password -chatKeyPassword');

        res.status(200).json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            phoneNumber: updatedUser.phoneNumber,
            email: updatedUser.email,
            profilePic: updatedUser.profilePic,
            createdAt: updatedUser.createdAt,
        });
    } catch (error) {
        console.log("Error in updatePhone controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Update avatar/profile picture
 * PUT /user/update-avatar
 */
export const updateAvatar = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        if (!profilePic) {
            return res.status(400).json({ message: "Profile picture is required" });
        }

        // Upload to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(profilePic);

        // Update user profile pic
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        ).select('-password -chatKeyPassword');

        res.status(200).json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            phoneNumber: updatedUser.phoneNumber,
            email: updatedUser.email,
            profilePic: updatedUser.profilePic,
            createdAt: updatedUser.createdAt,
        });
    } catch (error) {
        console.log("Error in updateAvatar controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Delete avatar (revert to default)
 * DELETE /user/delete-avatar
 */
export const deleteAvatar = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get current user to check for existing profile pic
        const user = await User.findById(userId);
        
        if (user.profilePic) {
            // Extract public_id from Cloudinary URL and delete the image
            try {
                const urlParts = user.profilePic.split('/');
                const publicIdWithExt = urlParts[urlParts.length - 1];
                const publicId = publicIdWithExt.split('.')[0];
                await cloudinary.uploader.destroy(publicId);
            } catch (cloudinaryError) {
                console.log("Error deleting image from cloudinary:", cloudinaryError);
                // Continue anyway - just clear the reference
            }
        }

        // Set profile pic to empty string (default)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: "" },
            { new: true }
        ).select('-password -chatKeyPassword');

        res.status(200).json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            phoneNumber: updatedUser.phoneNumber,
            email: updatedUser.email,
            profilePic: updatedUser.profilePic,
            createdAt: updatedUser.createdAt,
        });
    } catch (error) {
        console.log("Error in deleteAvatar controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Get current user profile
 * GET /user/profile
 */
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -chatKeyPassword');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            email: user.email,
            profilePic: user.profilePic,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.log("Error in getProfile controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
