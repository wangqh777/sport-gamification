// LocalStorage-based database that mimics the server API
// Used as fallback when backend is unreachable (e.g., on GitHub Pages)

const DB_KEY = 'fitness_rpg_db';
const USER_KEY = 'fitness_rpg_user';

function getDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : createEmptyDB();
  } catch { return createEmptyDB(); }
}

function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }

function createEmptyDB() {
  return {
    users: [],
    activities: [],
    achievements: [],
    friends: [],
    teams: [],
    teamMessages: [],
    pkMatches: [],
    matchRequests: [],
    socialPosts: [],
    shopItems: [
      { id:'exp_card_1h', name:'经验加成卡(1小时)', type:'consumable', description:'运动经验翻倍，持续1小时', price:200, effect:'double_exp', rarity:'common', icon:'⭐' },
      { id:'exp_card_24h', name:'经验加成卡(24小时)', type:'consumable', description:'运动经验翻倍，持续24小时', price:800, effect:'double_exp', rarity:'rare', icon:'🌟' },
      { id:'coin_card_1h', name:'金币加成卡(1小时)', type:'consumable', description:'运动金币翻倍，持续1小时', price:150, effect:'double_coin', rarity:'common', icon:'💰' },
      { id:'coin_card_24h', name:'金币加成卡(24小时)', type:'consumable', description:'运动金币翻倍，持续24小时', price:600, effect:'double_coin', rarity:'rare', icon:'💎' },
      { id:'avatar_flame', name:'烈焰头像框', type:'avatar_frame', description:'酷炫的火焰边框', price:500, rarity:'common', icon:'🔥' },
      { id:'avatar_ice', name:'冰霜头像框', type:'avatar_frame', description:'冷静的冰霜边框', price:500, rarity:'common', icon:'❄️' },
      { id:'avatar_gold', name:'黄金头像框', type:'avatar_frame', description:'尊贵的金色边框', price:1000, rarity:'rare', icon:'👑' },
      { id:'title_runner', name:'追风者称号', type:'title', description:'使用称号：追风者', price:300, rarity:'common', icon:'🏃' },
      { id:'title_beast', name:'猛兽称号', type:'title', description:'使用称号：猛兽', price:300, rarity:'common', icon:'🦁' },
      { id:'title_legend', name:'传奇称号', type:'title', description:'使用称号：传奇', price:1200, rarity:'rare', icon:'🏆' },
      { id:'streak_shield', name:'连击护盾', type:'consumable', description:'断签时保护连击天数1次', price:400, effect:'streak_shield', rarity:'rare', icon:'🛡️' },
    ],
    userItems: [],
  };
}

let uid = 0;
function genId() { return 'local_' + (++uid) + '_' + Date.now(); }

function xpForLevel(lvl) { return Math.floor(100 * Math.pow(1.25, lvl - 1)); }
function getPkRank(score) {
  if (score >= 3000) return '钻石'; if (score >= 2500) return '铂金';
  if (score >= 2000) return '黄金'; if (score >= 1500) return '白银'; return '青铜';
}
function getRank(sp) {
  if (sp >= 11000) return '王者'; if (sp >= 9000) return '宗师'; if (sp >= 7500) return '大师';
  if (sp >= 4800) return '钻石'; if (sp >= 2800) return '铂金'; if (sp >= 1400) return '黄金';
  if (sp >= 600) return '白银'; return '青铜';
}

export const localDB = {
  // ===== AUTH =====
  register(username, password) {
    const db = getDB();
    if (db.users.find(u => u.username === username)) throw new Error('用户名已存在');
    const user = {
      id: genId(), username, password, level: 1, exp: 0, coins: 200,
      avatar: '⚔️', title: '初级冒险者', class: 'warrior',
      stats: { str:10, end:10, agi:10, flex:10, pow:10, spi:10 },
      streak: 0, lastExerciseDate: null, totalMinutes: 0, totalCalories: 0,
      totalExercises: 0, pkScore: 1000, pkRank: '青铜', seasonPoints: 0,
    };
    db.users.push(user);
    saveDB(db);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { user };
  },

  login(username, password) {
    const db = getDB();
    const user = db.users.find(u => u.username === username && u.password === password);
    if (!user) throw new Error('用户名或密码错误');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { user };
  },

  getUser(id) {
    const db = getDB();
    const user = db.users.find(u => u.id === id);
    if (!user) throw new Error('用户不存在');
    return { user: { ...user, stats: typeof user.stats === 'string' ? JSON.parse(user.stats) : user.stats } };
  },

  searchUsers(keyword, userId) {
    const db = getDB();
    const users = db.users.filter(u => u.username.includes(keyword) && u.id !== userId);
    return { users: users.map(u => ({ ...u, password: undefined })) };
  },

  getLeaderboard() {
    const db = getDB();
    const list = db.users.map(u => ({
      id: u.id, username: u.username, level: u.level, avatar: u.avatar,
      title: u.title, seasonPoints: u.seasonPoints, pkScore: u.pkScore,
    })).sort((a, b) => b.seasonPoints - a.seasonPoints).slice(0, 20);
    return { leaderboard: list };
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  updateCurrentUser(user) {
    const db = getDB();
    const idx = db.users.findIndex(u => u.id === user.id);
    if (idx >= 0) db.users[idx] = user;
    saveDB(db);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  // ===== ACTIVITY =====
  getExerciseTypes() {
    return { types: [
      { id:'running', name:'跑步', icon:'🏃', calPerMin:10, baseXP:5, stat:'end', statName:'耐力' },
      { id:'jump_rope', name:'跳绳', icon:'🪢', calPerMin:12, baseXP:6, stat:'agi', statName:'敏捷' },
      { id:'pushup', name:'俯卧撑', icon:'💪', calPerMin:8, baseXP:5, stat:'str', statName:'力量' },
      { id:'situp', name:'仰卧起坐', icon:'🦾', calPerMin:7, baseXP:4, stat:'flex', statName:'柔韧' },
      { id:'cycling', name:'骑行', icon:'🚴', calPerMin:9, baseXP:5, stat:'end', statName:'耐力' },
      { id:'swimming', name:'游泳', icon:'🏊', calPerMin:11, baseXP:7, stat:'flex', statName:'柔韧' },
      { id:'hiit', name:'HIIT', icon:'🔥', calPerMin:14, baseXP:8, stat:'pow', statName:'爆发' },
      { id:'basketball', name:'篮球', icon:'🏀', calPerMin:9, baseXP:5, stat:'agi', statName:'敏捷' },
      { id:'yoga', name:'瑜伽', icon:'🧘', calPerMin:5, baseXP:4, stat:'spi', statName:'精神' },
    ]};
  },

  logActivity({ userId, type, duration, intensity = 'medium', note = '' }) {
    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) throw new Error('用户不存在');

    const types = this.getExerciseTypes().types;
    const cfg = types.find(t => t.id === type);
    if (!cfg) throw new Error('未知运动类型');

    const mult = { low: 0.7, medium: 1.0, high: 1.5 }[intensity] || 1;
    const calories = Math.round(cfg.calPerMin * duration * mult);
    const expEarned = Math.round(cfg.baseXP * duration * mult);
    const coinsEarned = Math.round(expEarned * 0.6);
    const statGain = Math.round(duration * mult);

    // Save activity
    const activity = { id: genId(), userId, type, duration, calories, expEarned, coinsEarned,
      statGain: JSON.stringify({ type: cfg.stat, gain: statGain }), note, createdAt: new Date().toISOString() };
    db.activities.push(activity);

    // Update user
    const levelResult = this._addExp(user, expEarned);
    const stats = typeof user.stats === 'string' ? JSON.parse(user.stats) : user.stats;
    stats[cfg.stat] = (stats[cfg.stat] || 10) + statGain;
    user.stats = stats;
    user.totalMinutes += duration;
    user.totalCalories += calories;
    user.totalExercises += 1;
    user.coins += coinsEarned;
    user.seasonPoints = (user.seasonPoints || 0) + expEarned;

    // Streak
    const today = new Date().toISOString().slice(0, 10);
    if (user.lastExerciseDate) {
      const diff = Math.floor((new Date() - new Date(user.lastExerciseDate)) / 86400000);
      if (diff === 1) user.streak++;
      else if (diff > 1) user.streak = 1;
    } else { user.streak = 1; }
    user.lastExerciseDate = today;

    saveDB(db);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    // Auto social post for significant workouts
    if (duration >= 20) {
      this._createPost(userId, `完成了${duration}分钟的${cfg.name}训练！消耗${calories}卡路里 🔥`, activity.id);
    }

    // Check achievements
    const newAchievements = this.checkAchievements(userId);

    return { activity, levelResult, streak: user.streak, user, newAchievements };
  },

  _addExp(user, amount) {
    let { level, exp } = user;
    exp += amount;
    let leveledUp = false;
    const oldLevel = level;
    while (exp >= xpForLevel(level)) { exp -= xpForLevel(level); level++; leveledUp = true; }
    user.exp = exp;
    user.level = level;
    return { level, exp, leveledUp, oldLevel, newLevel: level, xpForNext: xpForLevel(level) };
  },

  getHistory(userId, limit = 30) {
    const db = getDB();
    const activities = db.activities.filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
    return { activities };
  },

  getStats(userId, period = 'week') {
    const db = getDB();
    const now = new Date();
    const start = new Date(now);
    if (period === 'week') start.setDate(now.getDate() - 7);
    else if (period === 'month') start.setMonth(now.getMonth() - 1);
    else start.setFullYear(now.getFullYear() - 1);
    const startStr = start.toISOString().slice(0, 10);

    const activities = db.activities.filter(a => a.userId === userId && a.createdAt >= startStr);
    const stats = {
      sessions: activities.length,
      totalMinutes: activities.reduce((s, a) => s + a.duration, 0),
      totalCalories: activities.reduce((s, a) => s + a.calories, 0),
      totalExp: activities.reduce((s, a) => s + a.expEarned, 0),
    };
    const typeCount = {};
    activities.forEach(a => { typeCount[a.type] = (typeCount[a.type] || 0) + 1; });
    const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    return { stats: { ...stats, topType, period } };
  },

  // ===== ACHIEVEMENTS =====
  ACHIEVEMENT_DEFS: [
    { key:'first_exercise', name:'初次启程', desc:'完成第一次运动', icon:'🌟', tier:'novice' },
    { key:'first_checkin', name:'首次打卡', desc:'连续运动2天', icon:'📅', tier:'novice' },
    { key:'first_friend', name:'找到伙伴', desc:'添加第一个好友', icon:'🤝', tier:'novice' },
    { key:'daily_30min', name:'半小时战士', desc:'单次运动超过30分钟', icon:'⏱️', tier:'daily' },
    { key:'cal_500', name:'燃脂新手', desc:'累计消耗500卡路里', icon:'🔥', tier:'daily' },
    { key:'three_types', name:'全面开花', desc:'尝试过3种不同运动', icon:'🎯', tier:'daily' },
    { key:'friend_workout', name:'并肩作战', desc:'和好友在同一天运动', icon:'👥', tier:'daily' },
    { key:'streak_7', name:'七日连击', desc:'连续运动7天', icon:'🔥', tier:'challenge' },
    { key:'streak_14', name:'半月坚持', desc:'连续运动14天', icon:'💪', tier:'challenge' },
    { key:'streak_30', name:'月度传说', desc:'连续运动30天', icon:'👑', tier:'challenge' },
    { key:'total_100km', name:'百里之行', desc:'累计运动距离达100公里', icon:'🛣️', tier:'challenge' },
    { key:'total_1000min', name:'千分钟俱乐部', desc:'累计运动1000分钟', icon:'⏰', tier:'challenge' },
    { key:'pk_10wins', name:'十连胜', desc:'PK获得10次胜利', icon:'⚔️', tier:'challenge' },
    { key:'team_weekly', name:'最佳队友', desc:'完成3次小队周任务', icon:'🤝', tier:'challenge' },
    { key:'early_bird', name:'晨曦勇士', desc:'在早上6点前完成运动', icon:'🌅', tier:'hidden' },
    { key:'night_owl', name:'夜行动物', desc:'在晚上11点后完成运动', icon:'🦉', tier:'hidden' },
    { key:'weekend_warrior', name:'周末战士', desc:'周末两天都运动', icon:'🎉', tier:'hidden' },
    { key:'variety_master', name:'全能选手', desc:'尝试过所有运动类型', icon:'🌈', tier:'hidden' },
    { key:'social_butterfly', name:'社交达人', desc:'和10个不同的人一起运动', icon:'🦋', tier:'hidden' },
    { key:'coins_1000', name:'小富翁', desc:'积累1000金币', icon:'💎', tier:'daily' },
  ],

  getAchievementDefs() {
    return { achievements: this.ACHIEVEMENT_DEFS };
  },

  getAllAchievements(userId) {
    const db = getDB();
    const userAchievements = db.achievements.filter(a => a.userId === userId);
    const earnedKeys = userAchievements.map(a => a.achievementKey);
    const list = this.ACHIEVEMENT_DEFS.map(def => ({ ...def, unlocked: earnedKeys.includes(def.key) }));
    return { achievements: list, unlocked: list.filter(a => a.unlocked).length, total: list.length };
  },

  checkAchievements(userId) {
    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) return [];
    const earnedKeys = db.achievements.filter(a => a.userId === userId).map(a => a.achievementKey);
    const activities = db.activities.filter(a => a.userId === userId);
    const friendCount = db.friends.filter(f => f.userId === userId).length;
    const today = new Date().toISOString().slice(0, 10);
    const newlyUnlocked = [];

    for (const def of this.ACHIEVEMENT_DEFS) {
      if (earnedKeys.includes(def.key)) continue;
      let ok = false;
      switch (def.key) {
        case 'first_exercise': ok = activities.length >= 1; break;
        case 'first_checkin': ok = user.streak >= 2; break;
        case 'first_friend': ok = friendCount >= 1; break;
        case 'daily_30min': ok = activities.some(a => a.duration >= 30); break;
        case 'cal_500': ok = user.totalCalories >= 500; break;
        case 'three_types': ok = new Set(activities.map(a => a.type)).size >= 3; break;
        case 'friend_workout': {
          const friendIds = db.friends.filter(f => f.userId === userId).map(f => f.friendId);
          ok = friendIds.length > 0 && db.activities.some(a => friendIds.includes(a.userId) && a.createdAt?.slice(0,10) === today);
          break;
        }
        case 'streak_7': ok = user.streak >= 7; break;
        case 'streak_14': ok = user.streak >= 14; break;
        case 'streak_30': ok = user.streak >= 30; break;
        case 'total_100km': {
          const dist = activities.filter(a => a.type === 'running' || a.type === 'cycling').reduce((s, a) => s + a.duration * 0.15, 0);
          ok = dist >= 100; break;
        }
        case 'total_1000min': ok = user.totalMinutes >= 1000; break;
        case 'pk_10wins': {
          const wins = db.pkMatches.filter(p => p.winnerId === userId).length;
          ok = wins >= 10; break;
        }
        case 'team_weekly': {
          const team = db.teams.find(t => {
            const members = typeof t.memberIds === 'string' ? JSON.parse(t.memberIds) : t.memberIds;
            return members.includes(userId);
          });
          ok = team && (team.weeklyProgress || 0) >= (team.weeklyGoal || 300);
          break;
        }
        case 'early_bird': ok = new Date().getHours() < 6 && activities.some(a => a.createdAt?.slice(0,10) === today); break;
        case 'night_owl': ok = new Date().getHours() >= 23 && activities.some(a => a.createdAt?.slice(0,10) === today); break;
        case 'weekend_warrior': {
          const d = new Date(); const sat = new Date(d); sat.setDate(d.getDate() - d.getDay() + 6);
          const sun = new Date(sat); sun.setDate(sat.getDate() + 1);
          ok = activities.some(a => a.createdAt?.slice(0,10) === sat.toISOString().slice(0,10)) &&
               activities.some(a => a.createdAt?.slice(0,10) === sun.toISOString().slice(0,10));
          break;
        }
        case 'variety_master': ok = new Set(activities.map(a => a.type)).size >= 9; break;
        case 'social_butterfly': {
          const partners = new Set();
          db.pkMatches.filter(p => p.challengerId === userId || p.challengedId === userId).forEach(p => {
            partners.add(p.challengerId === userId ? p.challengedId : p.challengerId);
          });
          ok = partners.size >= 10; break;
        }
        case 'coins_1000': ok = user.coins >= 1000; break;
      }
      if (ok) {
        db.achievements.push({ id: genId(), userId, achievementKey: def.key, unlockedAt: new Date().toISOString() });
        newlyUnlocked.push(def);
        this._createPost(userId, `解锁了成就：${def.name}！${def.desc}`, null, def.key);
      }
    }
    if (newlyUnlocked.length > 0) saveDB(db);
    return newlyUnlocked;
  },

  // ===== SOCIAL =====
  addFriend(userId, friendId) {
    const db = getDB();
    if (userId === friendId) throw new Error('不能添加自己');
    const exists = db.friends.find(f => f.userId === userId && f.friendId === friendId);
    if (exists) throw new Error('已经是好友了');
    db.friends.push({ id: genId(), userId, friendId });
    db.friends.push({ id: genId(), userId: friendId, friendId: userId });
    saveDB(db);
    return { success: true };
  },

  removeFriend(userId, friendId) {
    const db = getDB();
    db.friends = db.friends.filter(f => !((f.userId === userId && f.friendId === friendId) || (f.userId === friendId && f.friendId === userId)));
    saveDB(db);
    return { success: true };
  },

  getFriends(userId) {
    const db = getDB();
    const friendIds = db.friends.filter(f => f.userId === userId).map(f => f.friendId);
    const friends = friendIds.map(id => {
      const u = db.users.find(u => u.id === id);
      return u ? { ...u, password: undefined, stats: typeof u.stats === 'string' ? JSON.parse(u.stats) : u.stats } : null;
    }).filter(Boolean);
    return { friends };
  },

  getFeed(userId) {
    const db = getDB();
    const friendIds = db.friends.filter(f => f.userId === userId).map(f => f.friendId);
    friendIds.push(userId);
    const posts = db.socialPosts.filter(p => friendIds.includes(p.userId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 40);
    return { posts: posts.map(p => {
      const u = db.users.find(u => u.id === p.userId);
      return { ...p, username: u?.username || '未知', avatar: u?.avatar || '👤', level: u?.level || 1, title: u?.title };
    })};
  },

  toggleLike(postId, userId) {
    const db = getDB();
    const post = db.socialPosts.find(p => p.id === postId);
    if (!post) throw new Error('动态不存在');
    const likes = post.likes || [];
    const idx = likes.indexOf(userId);
    if (idx >= 0) likes.splice(idx, 1); else likes.push(userId);
    post.likes = likes;
    saveDB(db);
    return { likes };
  },

  addComment(postId, userId, content) {
    const db = getDB();
    const post = db.socialPosts.find(p => p.id === postId);
    if (!post) throw new Error('动态不存在');
    const comments = post.comments || [];
    comments.push({ id: genId(), userId, content, createdAt: new Date().toISOString() });
    post.comments = comments;
    saveDB(db);
    return { comments };
  },

  _createPost(userId, content, activityId = null, achievementKey = null) {
    const db = getDB();
    db.socialPosts.push({ id: genId(), userId, content, activityId, achievementKey, likes: [], comments: [], createdAt: new Date().toISOString() });
    saveDB(db);
  },

  // ===== TEAM =====
  getMyTeam(userId) {
    const db = getDB();
    const team = db.teams.find(t => {
      const members = typeof t.memberIds === 'string' ? JSON.parse(t.memberIds) : t.memberIds;
      return members.includes(userId);
    });
    if (team) return { team: this._formatTeam(team) };
    return { team: null };
  },

  getTeam(teamId) {
    const db = getDB();
    const team = db.teams.find(t => t.id === teamId);
    if (!team) throw new Error('队伍不存在');
    return { team: this._formatTeam(team) };
  },

  createTeam(userId, name) {
    const db = getDB();
    const existing = db.teams.find(t => {
      const members = typeof t.memberIds === 'string' ? JSON.parse(t.memberIds) : t.memberIds;
      return members.includes(userId);
    });
    if (existing) throw new Error('你已经在一个队伍中');
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const team = { id: genId(), name, leaderId: userId, memberIds: [userId],
      weeklyGoal: 300, weeklyProgress: 0, weekStart: weekStart.toISOString().slice(0, 10) };
    db.teams.push(team);
    saveDB(db);
    return { team: this._formatTeam(team) };
  },

  joinTeam(userId, teamId) {
    const db = getDB();
    const existing = db.teams.find(t => {
      const members = typeof t.memberIds === 'string' ? JSON.parse(t.memberIds) : t.memberIds;
      return members.includes(userId);
    });
    if (existing) throw new Error('你已经在一个队伍中');
    const team = db.teams.find(t => t.id === teamId);
    if (!team) throw new Error('队伍不存在');
    let members = typeof team.memberIds === 'string' ? JSON.parse(team.memberIds) : team.memberIds;
    if (members.length >= 4) throw new Error('队伍已满（最多4人）');
    members.push(userId);
    team.memberIds = members;
    saveDB(db);
    return { team: this._formatTeam(team) };
  },

  leaveTeam(userId, teamId) {
    const db = getDB();
    const team = db.teams.find(t => t.id === teamId);
    if (!team) throw new Error('队伍不存在');
    let members = typeof team.memberIds === 'string' ? JSON.parse(team.memberIds) : team.memberIds;
    members = members.filter(id => id !== userId);
    if (members.length === 0) { db.teams = db.teams.filter(t => t.id !== teamId); saveDB(db); return { deleted: true }; }
    team.memberIds = members;
    if (team.leaderId === userId) team.leaderId = members[0];
    saveDB(db);
    return { team: this._formatTeam(team) };
  },

  getTeamLeaderboard() {
    const db = getDB();
    const list = db.teams.map(t => ({
      id: t.id, name: t.name,
      memberCount: (typeof t.memberIds === 'string' ? JSON.parse(t.memberIds) : t.memberIds).length,
      weeklyProgress: t.weeklyProgress || 0, weeklyGoal: t.weeklyGoal || 300,
    })).sort((a, b) => b.weeklyProgress - a.weeklyProgress);
    return { leaderboard: list };
  },

  sendTeamMessage(teamId, userId, content) {
    const db = getDB();
    const msg = { id: genId(), teamId, userId, content, createdAt: new Date().toISOString() };
    db.teamMessages.push(msg);
    saveDB(db);
    return msg;
  },

  _formatTeam(team) {
    const db = getDB();
    const members = (typeof team.memberIds === 'string' ? JSON.parse(team.memberIds) : team.memberIds).map(id => {
      const u = db.users.find(u => u.id === id);
      return u ? { id: u.id, username: u.username, avatar: u.avatar, level: u.level, title: u.title, streak: u.streak, totalMinutes: u.totalMinutes } : null;
    }).filter(Boolean);
    const messages = db.teamMessages.filter(m => m.teamId === team.id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const msgsWithUser = messages.map(m => {
      const u = db.users.find(u => u.id === m.userId);
      return { ...m, username: u?.username || '未知', avatar: u?.avatar };
    });
    return { ...team, memberIds: members.map(m => m.id), members, messages: msgsWithUser, weeklyProgress: team.weeklyProgress || 0 };
  },

  // ===== PK =====
  createPK(challengerId, challengedId, duration) {
    const db = getDB();
    if (![15, 30, 60].includes(duration)) throw new Error('PK时长必须为15、30或60分钟');
    const match = { id: genId(), challengerId, challengedId, duration,
      challengerProgress: 0, challengedProgress: 0, status: 'pending', createdAt: new Date().toISOString() };
    db.pkMatches.push(match);
    saveDB(db);
    return { match };
  },

  respondPK(matchId, userId, accept) {
    const db = getDB();
    const match = db.pkMatches.find(m => m.id === matchId);
    if (!match) throw new Error('PK不存在');
    if (match.challengedId !== userId) throw new Error('你没有权限');
    match.status = accept ? 'active' : 'declined';
    saveDB(db);
    return { match };
  },

  updatePKProgress(matchId, userId, progress) {
    const db = getDB();
    const match = db.pkMatches.find(m => m.id === matchId);
    if (!match || match.status !== 'active') throw new Error('PK未在进行中');
    if (match.challengerId === userId) match.challengerProgress = progress;
    else match.challengedProgress = progress;
    if (match.challengerProgress >= match.duration && match.challengedProgress >= match.duration) {
      const cProg = match.challengerProgress, dProg = match.challengedProgress;
      match.winnerId = cProg >= dProg ? match.challengerId : match.challengedId;
      match.status = 'completed';
      // Update scores
      const winner = db.users.find(u => u.id === match.winnerId);
      const loserId = match.winnerId === match.challengerId ? match.challengedId : match.challengerId;
      const loser = db.users.find(u => u.id === loserId);
      if (winner) { winner.pkScore += 50; winner.coins += 100; winner.pkRank = getPkRank(winner.pkScore); winner.seasonPoints = (winner.seasonPoints||0) + 80; }
      if (loser) { loser.pkScore = Math.max(0, loser.pkScore - 20); loser.coins = Math.max(0, loser.coins - 30); loser.pkRank = getPkRank(loser.pkScore); }
      this._createPost(match.winnerId, `在PK中战胜了对手！🏆 PK段位：${winner?.pkRank || '青铜'}`);
    }
    saveDB(db);
    return { match };
  },

  getPKs(userId) {
    const db = getDB();
    const pks = db.pkMatches.filter(m => m.challengerId === userId || m.challengedId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 30);
    return { pks };
  },

  getActivePK(userId) {
    const db = getDB();
    const pk = db.pkMatches.find(m => (m.challengerId === userId || m.challengedId === userId) && m.status === 'active');
    return { pk: pk || null };
  },

  // ===== MATCH =====
  createMatchRequest({ userId, type, location, timePreference, genderPreference }) {
    const db = getDB();
    const req = { id: genId(), userId, type, location, timePreference: timePreference || '', genderPreference: genderPreference || 'any',
      status: 'open', createdAt: new Date().toISOString() };
    db.matchRequests.push(req);
    saveDB(db);
    return { id: req.id };
  },

  findMatch(userId) {
    const db = getDB();
    const myReq = db.matchRequests.filter(r => r.userId === userId && r.status === 'open').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    if (!myReq) throw new Error('请先发布约跑请求');
    const match = db.matchRequests.find(r => r.userId !== userId && r.status === 'open' && r.type === myReq.type);
    if (match) {
      myReq.status = 'matched'; myReq.matchedUserId = match.userId;
      match.status = 'matched'; match.matchedUserId = userId;
      saveDB(db);
      const u = db.users.find(u => u.id === match.userId);
      return { match: { ...match, username: u?.username, avatar: u?.avatar, level: u?.level, totalMinutes: u?.totalMinutes,
        stats: typeof u?.stats === 'string' ? JSON.parse(u.stats) : (u?.stats || {}) }, myRequestId: myReq.id };
    }
    return { waiting: true, myRequestId: myReq.id };
  },

  // ===== SHOP =====
  getShopItems() {
    const db = getDB();
    return { items: db.shopItems };
  },

  getMyItems(userId) {
    const db = getDB();
    const items = db.userItems.filter(i => i.userId === userId).map(ui => {
      const si = db.shopItems.find(s => s.id === ui.itemId);
      return si ? { ...ui, name: si.name, type: si.type, description: si.description, effect: si.effect, icon: si.icon, rarity: si.rarity } : ui;
    });
    return { items };
  },

  buyItem(userId, itemId) {
    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    const item = db.shopItems.find(i => i.id === itemId);
    if (!item) throw new Error('道具不存在');
    if (user.coins < item.price) throw new Error('金币不足');
    if (item.type !== 'consumable' && db.userItems.some(ui => ui.userId === userId && ui.itemId === itemId)) throw new Error('已拥有');
    user.coins -= item.price;
    db.userItems.push({ id: genId(), userId, itemId, equipped: 0 });
    saveDB(db);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { success: true, item, newBalance: user.coins };
  },

  equipItem(userId, userItemId) {
    const db = getDB();
    const ui = db.userItems.find(i => i.id === userItemId && i.userId === userId);
    if (!ui) throw new Error('道具不存在');
    const item = db.shopItems.find(s => s.id === ui.itemId);
    if (!item) throw new Error('道具不存在');
    // Unequip same type
    db.userItems.forEach(i => {
      const s = db.shopItems.find(s => s.id === i.itemId);
      if (i.userId === userId && s?.type === item.type) i.equipped = 0;
    });
    ui.equipped = 1;
    if (item.type === 'title') {
      const user = db.users.find(u => u.id === userId);
      if (user) user.title = item.name;
    }
    saveDB(db);
    return { success: true };
  },

  useItem(userId, userItemId) {
    const db = getDB();
    const idx = db.userItems.findIndex(i => i.id === userItemId && i.userId === userId);
    if (idx < 0) throw new Error('道具不存在');
    const ui = db.userItems[idx];
    const item = db.shopItems.find(s => s.id === ui.itemId);
    if (item?.type !== 'consumable') throw new Error('该道具无法使用');
    db.userItems.splice(idx, 1);
    saveDB(db);
    return { success: true, effect: item?.effect };
  },
};
