const express = require("express");
const { 
  getAllUsers, 
  getUserDetails, 
  getDashboardStats,
  updateUserRole,
  deleteUser,
  getChallengeAnalytics,
  getPlatformTrends,
  getUserActivities,
  getTopUsers
} = require('../controllers/adminController');
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

// User management routes
router.get('/users', protect, adminOnly, getAllUsers);
router.get('/users/:id', protect, adminOnly, getUserDetails);
router.put('/users/:id/role', protect, adminOnly, updateUserRole);
router.delete('/users/:id', protect, adminOnly, deleteUser);

// Analytics & Statistics routes
router.get('/stats', protect, adminOnly, getDashboardStats);
router.get('/challenges/analytics', protect, adminOnly, getChallengeAnalytics);
router.get('/trends', protect, adminOnly, getPlatformTrends);
router.get('/top-users', protect, adminOnly, getTopUsers);

// Activity monitoring routes
router.get('/activities', protect, adminOnly, getUserActivities);

module.exports = router;
