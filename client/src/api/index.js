import { localDB } from './localDB';

const BASE = '/api';
let serverAvailable = true;

async function serverRequest(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

// Try server first, fall back to localStorage
async function request(url, options = {}, fallbackFn) {
  if (!serverAvailable && fallbackFn) return fallbackFn();
  try {
    const result = await serverRequest(url, options);
    serverAvailable = true;
    return result;
  } catch (e) {
    if (fallbackFn) {
      serverAvailable = false;
      return fallbackFn();
    }
    throw e;
  }
}

const withFallback = (serverFn, localFn) => {
  return (...args) => serverFn(...args).catch(() => localFn(...args));
};

export const api = {
  // Auth
  login:        (username, password) => withFallback(
    () => request('/auth/login', { method:'POST', body:JSON.stringify({username,password}) }),
    () => localDB.login(username, password)
  )(),
  register:     (username, password) => withFallback(
    () => request('/auth/register', { method:'POST', body:JSON.stringify({username,password}) }),
    () => localDB.register(username, password)
  )(),
  getUser:      (id) => withFallback(
    () => request(`/auth/user/${id}`),
    () => localDB.getUser(id)
  )(),
  searchUsers:  (keyword, userId) => withFallback(
    () => request(`/auth/search?keyword=${encodeURIComponent(keyword)}&userId=${userId}`),
    () => localDB.searchUsers(keyword, userId)
  )(),
  getLeaderboard: () => withFallback(
    () => request('/auth/leaderboard'),
    () => localDB.getLeaderboard()
  )(),

  // Activity
  getExerciseTypes: () => withFallback(
    () => request('/activity/types'),
    () => localDB.getExerciseTypes()
  )(),
  logActivity:   (data) => withFallback(
    () => request('/activity/log', { method:'POST', body:JSON.stringify(data) }),
    () => localDB.logActivity(data)
  )(),
  getHistory:    (userId, limit) => withFallback(
    () => request(`/activity/history/${userId}?limit=${limit||30}`),
    () => localDB.getHistory(userId, limit)
  )(),
  getCalendar:   (userId, year, month) => withFallback(
    () => request(`/activity/calendar/${userId}?year=${year}&month=${month}`),
    () => ({ calendar: [] })
  )(),
  getStats:      (userId, period) => withFallback(
    () => request(`/activity/stats/${userId}?period=${period}`),
    () => localDB.getStats(userId, period)
  )(),

  // Achievements
  getAchievements: (userId) => withFallback(
    () => request(`/achievement/user/${userId}`),
    () => localDB.getAllAchievements(userId)
  )(),
  getAchievementDefs: () => withFallback(
    () => request('/achievement/defs'),
    () => localDB.getAchievementDefs()
  )(),
  checkAchievements: (userId) => withFallback(
    () => request(`/achievement/check/${userId}`, { method:'POST' }),
    () => ({ newlyUnlocked: localDB.checkAchievements(userId) })
  )(),

  // Social
  getFriends:    (userId) => withFallback(
    () => request(`/social/friends/${userId}`),
    () => localDB.getFriends(userId)
  )(),
  addFriend:     (userId, friendId) => withFallback(
    () => request('/social/friend/add', { method:'POST', body:JSON.stringify({userId,friendId}) }),
    () => localDB.addFriend(userId, friendId)
  )(),
  removeFriend:  (userId, friendId) => withFallback(
    () => request('/social/friend/remove', { method:'POST', body:JSON.stringify({userId,friendId}) }),
    () => localDB.removeFriend(userId, friendId)
  )(),
  getFeed:       (userId) => withFallback(
    () => request(`/social/feed/${userId}`),
    () => localDB.getFeed(userId)
  )(),
  toggleLike:    (postId, userId) => withFallback(
    () => request('/social/feed/like', { method:'POST', body:JSON.stringify({postId,userId}) }),
    () => localDB.toggleLike(postId, userId)
  )(),
  addComment:    (postId, userId, content) => withFallback(
    () => request('/social/feed/comment', { method:'POST', body:JSON.stringify({postId,userId,content}) }),
    () => localDB.addComment(postId, userId, content)
  )(),
  createMatch:   (data) => withFallback(
    () => request('/social/match/create', { method:'POST', body:JSON.stringify(data) }),
    () => localDB.createMatchRequest(data)
  )(),
  findMatch:     (userId) => withFallback(
    () => request('/social/match/find', { method:'POST', body:JSON.stringify({userId}) }),
    () => localDB.findMatch(userId)
  )(),

  // Team
  getMyTeam:     (userId) => withFallback(
    () => request(`/team/my/${userId}`),
    () => localDB.getMyTeam(userId)
  )(),
  getTeam:       (teamId) => withFallback(
    () => request(`/team/${teamId}`),
    () => localDB.getTeam(teamId)
  )(),
  createTeam:    (userId, name) => withFallback(
    () => request('/team/create', { method:'POST', body:JSON.stringify({userId,name}) }),
    () => localDB.createTeam(userId, name)
  )(),
  joinTeam:      (userId, teamId) => withFallback(
    () => request('/team/join', { method:'POST', body:JSON.stringify({userId,teamId}) }),
    () => localDB.joinTeam(userId, teamId)
  )(),
  leaveTeam:     (userId, teamId) => withFallback(
    () => request('/team/leave', { method:'POST', body:JSON.stringify({userId,teamId}) }),
    () => localDB.leaveTeam(userId, teamId)
  )(),
  getTeamLeaderboard: () => withFallback(
    () => request('/team/leaderboard'),
    () => localDB.getTeamLeaderboard()
  )(),
  sendTeamMessage: (teamId, userId, content) => withFallback(
    () => request('/team/message', { method:'POST', body:JSON.stringify({teamId,userId,content}) }),
    () => localDB.sendTeamMessage(teamId, userId, content)
  )(),

  // PK
  getPKs:        (userId) => withFallback(
    () => request(`/pk/list/${userId}`),
    () => localDB.getPKs(userId)
  )(),
  getActivePK:   (userId) => withFallback(
    () => request(`/pk/active/${userId}`),
    () => localDB.getActivePK(userId)
  )(),
  createPK:      (challengerId, challengedId, duration) => withFallback(
    () => request('/pk/create', { method:'POST', body:JSON.stringify({challengerId,challengedId,duration}) }),
    () => localDB.createPK(challengerId, challengedId, duration)
  )(),
  respondPK:     (matchId, userId, accept) => withFallback(
    () => request('/pk/respond', { method:'POST', body:JSON.stringify({matchId,userId,accept}) }),
    () => localDB.respondPK(matchId, userId, accept)
  )(),
  updatePKProgress: (matchId, userId, progress) => withFallback(
    () => request('/pk/progress', { method:'POST', body:JSON.stringify({matchId,userId,progress}) }),
    () => localDB.updatePKProgress(matchId, userId, progress)
  )(),

  // Shop
  getShopItems:  () => withFallback(
    () => request('/shop/items'),
    () => localDB.getShopItems()
  )(),
  getMyItems:    (userId) => withFallback(
    () => request(`/shop/my-items/${userId}`),
    () => localDB.getMyItems(userId)
  )(),
  buyItem:       (userId, itemId) => withFallback(
    () => request('/shop/buy', { method:'POST', body:JSON.stringify({userId,itemId}) }),
    () => localDB.buyItem(userId, itemId)
  )(),
  equipItem:     (userId, userItemId) => withFallback(
    () => request('/shop/equip', { method:'POST', body:JSON.stringify({userId,userItemId}) }),
    () => localDB.equipItem(userId, userItemId)
  )(),
  useItem:       (userId, userItemId) => withFallback(
    () => request('/shop/use', { method:'POST', body:JSON.stringify({userId,userItemId}) }),
    () => localDB.useItem(userId, userItemId)
  )(),
};
