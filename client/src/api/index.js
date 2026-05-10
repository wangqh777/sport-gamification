const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  register: (username, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getUser: (id) => request(`/auth/user/${id}`),
  searchUsers: (keyword, userId) => request(`/auth/search?keyword=${encodeURIComponent(keyword)}&userId=${userId}`),
  getLeaderboard: () => request('/auth/leaderboard'),

  // Activity
  getExerciseTypes: () => request('/activity/types'),
  logActivity: (data) => request('/activity/log', { method: 'POST', body: JSON.stringify(data) }),
  getHistory: (userId, limit) => request(`/activity/history/${userId}?limit=${limit || 30}`),
  getCalendar: (userId, year, month) => request(`/activity/calendar/${userId}?year=${year}&month=${month}`),
  getStats: (userId, period) => request(`/activity/stats/${userId}?period=${period}`),

  // Achievements
  getAchievements: (userId) => request(`/achievement/user/${userId}`),
  getAchievementDefs: () => request('/achievement/defs'),
  checkAchievements: (userId) => request(`/achievement/check/${userId}`, { method: 'POST' }),

  // Social
  getFriends: (userId) => request(`/social/friends/${userId}`),
  addFriend: (userId, friendId) => request('/social/friend/add', { method: 'POST', body: JSON.stringify({ userId, friendId }) }),
  removeFriend: (userId, friendId) => request('/social/friend/remove', { method: 'POST', body: JSON.stringify({ userId, friendId }) }),
  getFeed: (userId) => request(`/social/feed/${userId}`),
  toggleLike: (postId, userId) => request('/social/feed/like', { method: 'POST', body: JSON.stringify({ postId, userId }) }),
  addComment: (postId, userId, content) => request('/social/feed/comment', { method: 'POST', body: JSON.stringify({ postId, userId, content }) }),
  createMatch: (data) => request('/social/match/create', { method: 'POST', body: JSON.stringify(data) }),
  findMatch: (userId) => request('/social/match/find', { method: 'POST', body: JSON.stringify({ userId }) }),

  // Team
  getMyTeam: (userId) => request(`/team/my/${userId}`),
  getTeam: (teamId) => request(`/team/${teamId}`),
  createTeam: (userId, name) => request('/team/create', { method: 'POST', body: JSON.stringify({ userId, name }) }),
  joinTeam: (userId, teamId) => request('/team/join', { method: 'POST', body: JSON.stringify({ userId, teamId }) }),
  leaveTeam: (userId, teamId) => request('/team/leave', { method: 'POST', body: JSON.stringify({ userId, teamId }) }),
  getTeamLeaderboard: () => request('/team/leaderboard'),
  sendTeamMessage: (teamId, userId, content) => request('/team/message', { method: 'POST', body: JSON.stringify({ teamId, userId, content }) }),

  // PK
  getPKs: (userId) => request(`/pk/list/${userId}`),
  getActivePK: (userId) => request(`/pk/active/${userId}`),
  createPK: (challengerId, challengedId, duration) => request('/pk/create', { method: 'POST', body: JSON.stringify({ challengerId, challengedId, duration }) }),
  respondPK: (matchId, userId, accept) => request('/pk/respond', { method: 'POST', body: JSON.stringify({ matchId, userId, accept }) }),
  updatePKProgress: (matchId, userId, progress) => request('/pk/progress', { method: 'POST', body: JSON.stringify({ matchId, userId, progress }) }),

  // Shop
  getShopItems: () => request('/shop/items'),
  getMyItems: (userId) => request(`/shop/my-items/${userId}`),
  buyItem: (userId, itemId) => request('/shop/buy', { method: 'POST', body: JSON.stringify({ userId, itemId }) }),
  equipItem: (userId, userItemId) => request('/shop/equip', { method: 'POST', body: JSON.stringify({ userId, userItemId }) }),
  useItem: (userId, userItemId) => request('/shop/use', { method: 'POST', body: JSON.stringify({ userId, userItemId }) }),
};
