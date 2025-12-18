const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// User routes
router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.get('/stats', protect, userController.getStats);
router.get('/achievements', protect, userController.getAchievements);

module.exports = router;
