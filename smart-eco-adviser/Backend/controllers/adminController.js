const User = require("../models/User");
const Challenge = require("../models/Challenge");
const UserChallenge = require("../models/UserChallenge");
const CarbonFootprint = require("../models/CarbonFootprint");

// @desc    Get all users with their progress (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .populate('completedChallenges')
      .sort({ createdAt: -1 });

    const usersWithProgress = await Promise.all(users.map(async (user) => {
      const activeChallenges = await UserChallenge.countDocuments({
        userId: user._id,
        status: 'in_progress'
      });

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        carbonFootprint: user.carbonFootprint.current,
        ecoActions: user.ecoActions,
        completedChallenges: user.completedChallenges.length,
        activeChallenges,
        joinedDate: user.createdAt
      };
    }));

    res.json(usersWithProgress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get user details (Admin only)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('completedChallenges');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userChallenges = await UserChallenge.find({ userId: user._id })
      .populate('challengeId');

    res.json({
      user,
      challenges: userChallenges
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get dashboard statistics (Admin only)
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalChallenges = await Challenge.countDocuments({ isActive: true });
    const activeChallenges = await UserChallenge.countDocuments({ status: 'in_progress' });
    const completedChallenges = await UserChallenge.countDocuments({ status: 'completed' });

    // Calculate total CO2 saved
    const users = await User.find({ role: 'user' }).select('carbonFootprint');
    const totalCO2Saved = users.reduce((sum, user) => {
      if (user.carbonFootprint.history.length > 1) {
        const first = user.carbonFootprint.history[0].total;
        const latest = user.carbonFootprint.current;
        return sum + Math.max(0, first - latest);
      }
      return sum;
    }, 0);

    res.json({
      totalUsers,
      totalChallenges,
      activeChallenges,
      completedChallenges,
      totalCO2Saved: Math.round(totalCO2Saved * 100) / 100
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Invalid role. Must be 'user' or 'admin'" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent changing own role
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: "Cannot change your own role" });
    }

    user.role = role;
    await user.save();

    res.json({ 
      message: `User role updated to ${role}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Delete user's related data
    await UserChallenge.deleteMany({ userId: user._id });
    await CarbonFootprint.deleteMany({ user: user._id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get challenge analytics (Admin only)
// @route   GET /api/admin/challenges/analytics
// @access  Private/Admin
const getChallengeAnalytics = async (req, res) => {
  try {
    const challenges = await Challenge.find({ isActive: true });

    const analyticsPromises = challenges.map(async (challenge) => {
      const totalStarted = await UserChallenge.countDocuments({ 
        challengeId: challenge._id 
      });
      const completed = await UserChallenge.countDocuments({ 
        challengeId: challenge._id, 
        status: 'completed' 
      });
      const inProgress = await UserChallenge.countDocuments({ 
        challengeId: challenge._id, 
        status: 'in_progress' 
      });

      const completionRate = totalStarted > 0 ? ((completed / totalStarted) * 100).toFixed(1) : 0;

      return {
        challengeId: challenge._id,
        title: challenge.title,
        category: challenge.category,
        difficulty: challenge.difficulty,
        totalStarted,
        completed,
        inProgress,
        completionRate: parseFloat(completionRate),
        points: challenge.points,
        co2Impact: challenge.co2Impact
      };
    });

    const analytics = await Promise.all(analyticsPromises);
    
    // Sort by most popular
    analytics.sort((a, b) => b.totalStarted - a.totalStarted);

    res.json({ analytics });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get platform trends (Admin only)
// @route   GET /api/admin/trends
// @access  Private/Admin
const getPlatformTrends = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // New users in last 30 days
    const newUsers30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      role: 'user'
    });

    const newUsers7Days = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      role: 'user'
    });

    // Challenges completed in last 30 days
    const challengesCompleted30Days = await UserChallenge.countDocuments({
      completedDate: { $gte: thirtyDaysAgo },
      status: 'completed'
    });

    const challengesCompleted7Days = await UserChallenge.countDocuments({
      completedDate: { $gte: sevenDaysAgo },
      status: 'completed'
    });

    // Carbon footprints recorded in last 30 days
    const carbonRecords30Days = await CarbonFootprint.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // User engagement: users with activity in last 7 days
    const activeUsers7Days = await UserChallenge.distinct('userId', {
      updatedAt: { $gte: sevenDaysAgo }
    });

    // Monthly trend data for charts
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const usersCount = await User.countDocuments({
        createdAt: { $gte: monthStart, $lte: monthEnd },
        role: 'user'
      });

      const challengesCount = await UserChallenge.countDocuments({
        completedDate: { $gte: monthStart, $lte: monthEnd },
        status: 'completed'
      });

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        newUsers: usersCount,
        challengesCompleted: challengesCount
      });
    }

    res.json({
      newUsers30Days,
      newUsers7Days,
      challengesCompleted30Days,
      challengesCompleted7Days,
      carbonRecords30Days,
      activeUsers7Days: activeUsers7Days.length,
      monthlyTrends
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get recent user activities (Admin only)
// @route   GET /api/admin/activities
// @access  Private/Admin
const getUserActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Get recent challenge activities
    const recentChallenges = await UserChallenge.find()
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .populate('challengeId', 'title points');

    // Get recent carbon footprint entries
    const recentFootprints = await CarbonFootprint.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email');

    // Combine and format activities
    const activities = [];

    recentChallenges.forEach(uc => {
      if (uc.userId && uc.challengeId) {
        activities.push({
          type: 'challenge',
          action: uc.status === 'completed' ? 'completed' : 'started',
          user: uc.userId.name,
          userEmail: uc.userId.email,
          details: uc.challengeId.title,
          points: uc.status === 'completed' ? uc.challengeId.points : null,
          timestamp: uc.updatedAt
        });
      }
    });

    recentFootprints.forEach(fp => {
      if (fp.user) {
        activities.push({
          type: 'carbon',
          action: 'calculated',
          user: fp.user.name,
          userEmail: fp.user.email,
          details: `${(fp.total / 1000).toFixed(2)} tons CO₂`,
          timestamp: fp.createdAt
        });
      }
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({ activities: activities.slice(0, limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get top performing users (Admin only)
// @route   GET /api/admin/top-users
// @access  Private/Admin
const getTopUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get users with most completed challenges
    const completedChallenges = await UserChallenge.aggregate([
      { $match: { status: 'completed' } },
      { $group: {
        _id: '$userId',
        count: { $sum: 1 },
        totalPoints: { $sum: { $ifNull: ['$points', 0] } }
      }},
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    const topUsers = await Promise.all(
      completedChallenges.map(async (item) => {
        const user = await User.findById(item._id).select('name email ecoActions');
        if (!user) return null;
        
        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          challengesCompleted: item.count,
          ecoActions: user.ecoActions
        };
      })
    );

    res.json({ topUsers: topUsers.filter(u => u !== null) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getAllUsers,
  getUserDetails,
  getDashboardStats,
  updateUserRole,
  deleteUser,
  getChallengeAnalytics,
  getPlatformTrends,
  getUserActivities,
  getTopUsers
};
