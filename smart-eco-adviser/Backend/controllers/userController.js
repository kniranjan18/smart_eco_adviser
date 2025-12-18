const User = require('../models/User');
const CarbonFootprint = require('../models/CarbonFootprint');
const UserChallenge = require('../models/UserChallenge');
const mongoose = require('mongoose');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, location } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, location },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get completed challenges count
    const completedChallenges = await UserChallenge.countDocuments({
      userId: userId,
      status: 'completed'
    });

    // Get active challenges count
    const activeChallenges = await UserChallenge.countDocuments({
      userId: userId,
      status: 'in_progress'
    });

    // Get total CO2 saved from carbon footprints
    const carbonData = await CarbonFootprint.find({ user: userId });
    let totalCO2Saved = 0;
    
    if (carbonData.length > 1) {
      // Calculate reduction from first to latest
      const firstFootprint = carbonData[0].total;
      const latestFootprint = carbonData[carbonData.length - 1].total;
      if (firstFootprint > latestFootprint) {
        totalCO2Saved = (firstFootprint - latestFootprint) / 1000; // Convert to tons
      }
    }

    // Calculate level based on completed challenges (simple formula)
    const xp = completedChallenges * 100;
    const level = Math.floor(xp / 1000) + 1;
    const nextLevelXp = level * 1000;

    // Fetch user to read login streak
    const userDoc = await User.findById(userId).select('streakCount')
    // Use login-based streak if available, else fallback to activity-based streak in last 7 days
    let activityStreak = await UserChallenge.countDocuments({
      userId: userId,
      status: 'completed',
      completedDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    const streak = (userDoc && userDoc.streakCount) ? userDoc.streakCount : Math.min(activityStreak, 30)

    // Get achievements count
    const achievements = Math.min(Math.floor(completedChallenges / 3), 10);

    res.json({
      level,
      xp: completedChallenges * 100,
      nextLevelXp,
      streak: Math.min(streak, 365),
      loginStreak: userDoc?.streakCount || 0,
      totalChallenges: completedChallenges + activeChallenges,
      completedChallenges,
      activeChallenges,
      co2Saved: totalCO2Saved.toFixed(2),
      achievements
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get user achievements
exports.getAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user stats
    const completedChallenges = await UserChallenge.countDocuments({
      userId: userId,
      status: 'completed'
    });

    const carbonData = await CarbonFootprint.find({ user: userId });
    let totalCO2Saved = 0;
    
    if (carbonData.length > 1) {
      const firstFootprint = carbonData[0].total;
      const latestFootprint = carbonData[carbonData.length - 1].total;
      if (firstFootprint > latestFootprint) {
        totalCO2Saved = (firstFootprint - latestFootprint) / 1000; // Convert to tons
      }
    }

    // Get streak
    const userDoc = await User.findById(userId).select('streakCount');
    const streak = userDoc?.streakCount || 0;

    // Count different challenge types completed
    const challengeTypes = await UserChallenge.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
      { $lookup: { from: 'challenges', localField: 'challengeId', foreignField: '_id', as: 'challenge' } },
      { $unwind: '$challenge' },
      { $group: { _id: '$challenge.category', count: { $sum: 1 } } }
    ]);

    const categoryCount = challengeTypes.length;

    // Define achievements with dynamic earned status
    const achievements = [
      {
        id: "first-steps",
        title: "First Steps",
        description: "Complete your first challenge",
        icon: "Target",
        earned: completedChallenges >= 1,
        progress: Math.min(completedChallenges, 1),
        target: 1
      },
      {
        id: "streak-master",
        title: "Streak Master",
        description: "Maintain a 7-day login streak",
        icon: "Zap",
        earned: streak >= 7,
        progress: Math.min(streak, 7),
        target: 7
      },
      {
        id: "eco-warrior",
        title: "Eco Warrior",
        description: "Complete 10 challenges",
        icon: "Award",
        earned: completedChallenges >= 10,
        progress: Math.min(completedChallenges, 10),
        target: 10
      },
      {
        id: "planet-saver",
        title: "Planet Saver",
        description: "Save 100kg of CO₂",
        icon: "TreePine",
        earned: totalCO2Saved >= 0.1, // 100kg = 0.1 tons
        progress: Math.min(totalCO2Saved * 10, 1), // Scale to 0-1
        target: 0.1
      },
      {
        id: "community-leader",
        title: "Community Leader",
        description: "Complete challenges in all 4 categories",
        icon: "Users",
        earned: categoryCount >= 4,
        progress: categoryCount,
        target: 4
      },
      {
        id: "consistent-contributor",
        title: "Consistent Contributor",
        description: "Complete 30 challenges",
        icon: "Trophy",
        earned: completedChallenges >= 30,
        progress: Math.min(completedChallenges, 30),
        target: 30
      },
      {
        id: "carbon-crusher",
        title: "Carbon Crusher",
        description: "Save 500kg of CO₂",
        icon: "Leaf",
        earned: totalCO2Saved >= 0.5,
        progress: Math.min(totalCO2Saved * 2, 1),
        target: 0.5
      },
      {
        id: "dedication",
        title: "Dedication",
        description: "Maintain a 30-day streak",
        icon: "Star",
        earned: streak >= 30,
        progress: Math.min(streak, 30),
        target: 30
      }
    ];

    res.json({ achievements });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: error.message });
  }
};
