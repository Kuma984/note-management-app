const express = require('express');
const router = express.Router();
const authController = require('./authController');
const { authenticate } = require('../../middlewares/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
