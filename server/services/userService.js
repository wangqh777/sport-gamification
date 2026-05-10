import db from '../db.js';
import { v4 as uuid } from 'uuid';

// XP curve: need more XP per level as you progress
export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.25, level - 1));
}

// Season rank based on PK score
export function getPkRank(score) {
  if (score >= 3000) return '钻石';
  if (score >= 2500) return '铂金';
  if (score >= 2000) return '黄金';
  if (score >= 1500) return '白银';
  return '青铜';
}

export function register(username, password) {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return { error: '用户名已存在' };

  const user = {
    id: uuid(),
    username,
    password, // plain-text for demo; use bcrypt in production
  };
  db.prepare(`INSERT INTO users (id, username, password) VALUES (?, ?, ?)`).run(user.id, user.username, user.password);
  return { user: getUserById(user.id) };
}

export function login(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
  if (!user) return { error: '用户名或密码错误' };
  return { user };
}

export function getUserById(id) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (user) user.stats = JSON.parse(user.stats);
  return user;
}

export function addExp(userId, amount) {
  const user = getUserById(userId);
  if (!user) return null;

  let { level, exp } = user;
  exp += amount;
  let leveledUp = false;

  while (exp >= xpForLevel(level)) {
    exp -= xpForLevel(level);
    level++;
    leveledUp = true;
  }

  db.prepare('UPDATE users SET level = ?, exp = ? WHERE id = ?').run(level, exp, userId);
  return { level, exp, leveledUp, xpForNext: xpForLevel(level) };
}

export function updateStats(userId, statType, gain) {
  const user = getUserById(userId);
  if (!user) return;
  const stats = user.stats;
  stats[statType] = (stats[statType] || 10) + gain;
  db.prepare('UPDATE users SET stats = ? WHERE id = ?').run(JSON.stringify(stats), userId);
  return stats;
}

export function updateStreak(userId) {
  const user = getUserById(userId);
  if (!user) return 0;

  const today = new Date().toISOString().slice(0, 10);
  let { streak, lastExerciseDate } = user;

  if (lastExerciseDate) {
    const last = new Date(lastExerciseDate);
    const diff = Math.floor((new Date() - last) / 86400000);
    if (diff === 1) streak++;
    else if (diff > 1) streak = 1;
    // diff === 0 means same day, keep streak
  } else {
    streak = 1;
  }

  db.prepare('UPDATE users SET streak = ?, lastExerciseDate = ? WHERE id = ?').run(streak, today, userId);
  return streak;
}

export function searchUsers(keyword, currentUserId) {
  return db.prepare(
    'SELECT id, username, level, avatar, title, totalMinutes, stats FROM users WHERE username LIKE ? AND id != ? LIMIT 20'
  ).all(`%${keyword}%`, currentUserId);
}

export function getLeaderboard() {
  return db.prepare(
    'SELECT id, username, level, avatar, title, seasonPoints, pkScore FROM users ORDER BY seasonPoints DESC LIMIT 20'
  ).all();
}
