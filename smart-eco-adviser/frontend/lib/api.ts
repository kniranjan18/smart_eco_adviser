const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Auth APIs
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },

  signup: async (name: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }
    return response.json();
  },
};

// Carbon Footprint APIs
export const carbonAPI = {
  saveCalculation: async (total: number, breakdown: any) => {
    const response = await fetch(`${API_BASE_URL}/carbon/calculate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ total, breakdown }),
    });
    if (!response.ok) throw new Error('Failed to save calculation');
    return response.json();
  },

  getHistory: async () => {
    const response = await fetch(`${API_BASE_URL}/carbon/history`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
  },

  getAnalytics: async () => {
    const response = await fetch(`${API_BASE_URL}/carbon/analytics`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
  },
};

// Challenge APIs
export const challengeAPI = {
  getChallenges: async () => {
    const response = await fetch(`${API_BASE_URL}/challenges`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch challenges');
    return response.json();
  },

  getUserChallenges: async () => {
    const response = await fetch(`${API_BASE_URL}/challenges/user`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user challenges');
    return response.json();
  },

  startChallenge: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/challenges/${id}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to start challenge');
    return response.json();
  },

  updateProgress: async (id: string, progress: number) => {
    const response = await fetch(`${API_BASE_URL}/challenges/${id}/progress`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ progress }),
    });
    if (!response.ok) throw new Error('Failed to update progress');
    return response.json();
  },

  createChallenge: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/challenges`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create challenge');
    return response.json();
  },

  updateChallenge: async (id: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}/challenges/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update challenge');
    return response.json();
  },

  deleteChallenge: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/challenges/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete challenge');
    return response.json();
  },

  getLeaderboard: async () => {
    const response = await fetch(`${API_BASE_URL}/challenges/leaderboard`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  },
};

// Eco Tips APIs
export const ecoTipsAPI = {
  getTips: async (
    lat?: number,
    lon?: number,
    city?: string,
    profile?: {
      commuteKm?: number;
      dietType?: string;
      budget?: string;
      goals?: string[];
    }
  ) => {
    const params = new URLSearchParams();
    if (lat) params.append('lat', lat.toString());
    if (lon) params.append('lon', lon.toString());
    if (city) params.append('city', city);
    if (profile?.commuteKm) params.append('commuteKm', String(profile.commuteKm));
    if (profile?.dietType) params.append('dietType', profile.dietType);
    if (profile?.budget) params.append('budget', profile.budget);
    if (profile?.goals?.length) params.append('goals', profile.goals.join(','));

    const response = await fetch(`${API_BASE_URL}/eco-tips?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch eco tips');
    return response.json();
  },
};

// User Profile APIs
export const userAPI = {
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch profile');
    return response.json();
  },

  updateProfile: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  },

  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/user/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user stats');
    return response.json();
  },

  getAchievements: async () => {
    const response = await fetch(`${API_BASE_URL}/user/achievements`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch achievements');
    return response.json();
  },
};

// Admin APIs
export const adminAPI = {
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  getUserDetails: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user details');
    return response.json();
  },

  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  updateUserRole: async (userId: string, role: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!response.ok) throw new Error('Failed to update user role');
    return response.json();
  },

  deleteUser: async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  },

  getChallengeAnalytics: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/challenges/analytics`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch challenge analytics');
    return response.json();
  },

  getPlatformTrends: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/trends`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch platform trends');
    return response.json();
  },

  getUserActivities: async (limit: number = 20) => {
    const response = await fetch(`${API_BASE_URL}/admin/activities?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch user activities');
    return response.json();
  },

  getTopUsers: async (limit: number = 10) => {
    const response = await fetch(`${API_BASE_URL}/admin/top-users?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch top users');
    return response.json();
  },
};
