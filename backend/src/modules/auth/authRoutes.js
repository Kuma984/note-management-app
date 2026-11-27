const express = require('express');
const router = express.Router();
const authController = require('./authController');
const { authenticate } = require('../../middlewares/auth');
const { uploadAvatar } = require('../../config/upload');

// Public auth routes
router.post('/register', authController.register);
router.get('/verify/:token', authController.verifyEmail);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected auth routes
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, authController.changePassword);
router.put('/preferences', authenticate, authController.updatePreferences);

// Avatar upload with validation error handling
router.put('/profile', authenticate, (req, res, next) => {
    uploadAvatar.single('avatar')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
}, authController.updateProfile);

module.exports = router;
