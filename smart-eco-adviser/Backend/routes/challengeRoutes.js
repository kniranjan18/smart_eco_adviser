const express = require("express");
const {
  getChallenges,
  getUserChallenges,
  startChallenge,
  updateChallengeProgress,
  createChallenge,
  updateChallenge,
  deleteChallenge,
  getLeaderboard
} = require("../controllers/challengeController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

const router = express.Router();

// Public/User routes
router.get("/", protect, getChallenges);
router.get("/user", protect, getUserChallenges);
router.get("/leaderboard", protect, getLeaderboard);
router.post("/:id/start", protect, startChallenge);
router.put("/:id/progress", protect, updateChallengeProgress);

// Admin routes
router.post("/", protect, adminOnly, createChallenge);
router.put("/:id", protect, adminOnly, updateChallenge);
router.delete("/:id", protect, adminOnly, deleteChallenge);

module.exports = router;
