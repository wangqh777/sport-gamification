import db from '../db.js';
import { v4 as uuid } from 'uuid';
import { addExp, updateStats, updateStreak, getUserById } from './userService.js';

const EXERCISE_CONFIG = {
  running:    { name:'跑步',   icon:'🏃', calPerMin:10, baseXP:5, stat:'end',  statName:'耐力' },
  jump_rope:  { name:'跳绳',   icon:'🪢', calPerMin:12, baseXP:6, stat:'agi',  statName:'敏捷' },
  pushup:     { name:'俯卧撑', icon:'💪', calPerMin:8,  baseXP:5, stat:'str',  statName:'力量' },
  situp:      { name:'仰卧起坐',icon:'🦾', calPerMin:7,  baseXP:4, stat:'flex', statName:'柔韧' },
  cycling:    { name:'骑行',   icon:'🚴', calPerMin:9,  baseXP:5, stat:'end',  statName:'耐力' },
  swimming:   { name:'游泳',   icon:'🏊', calPerMin:11, baseXP:7, stat:'flex', statName:'柔韧' },
  hiit:       { name:'HIIT',   icon:'🔥', calPerMin:14, baseXP:8, stat:'pow',  statName:'爆发' },
  basketball: { name:'篮球',   icon:'🏀', calPerMin:9,  baseXP:5, stat:'agi',  statName:'敏捷' },
  yoga:       { name:'瑜伽',   icon:'🧘', calPerMin:5,  baseXP:4, stat:'spi',  statName:'精神' },
};

export function getExerciseTypes() {
  return Object.entries(EXERCISE_CONFIG).map(([id, cfg]) => ({ id, ...cfg }));
}

export function logActivity(userId, { type, duration, intensity = 'medium', note = '' }) {
  const config = EXERCISE_CONFIG[type];
  if (!config) return { error: '未知运动类型' };

  const intensityMult = { low: 0.7, medium: 1.0, high: 1.5 }[intensity] || 1;
  const calories = Math.round(config.calPerMin * duration * intensityMult);
  const expEarned = Math.round(config.baseXP * duration * intensityMult);
  const coinsEarned = Math.round(expEarned * 0.6);
  const statGain = Math.round(duration * intensityMult);

  const activity = {
    id: uuid(),
    userId,
    type,
    duration,
    calories,
    expEarned,
    coinsEarned,
    statGain: JSON.stringify({ type: config.stat, gain: statGain }),
    note,
  };

  db.prepare(`INSERT INTO activities (id, userId, type, duration, calories, expEarned, coinsEarned, statGain, note)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(
    activity.id, activity.userId, activity.type, activity.duration,
    activity.calories, activity.expEarned, activity.coinsEarned, activity.statGain, activity.note
  );

  // Update user
  const levelResult = addExp(userId, expEarned);
  updateStats(userId, config.stat, statGain);
  const streak = updateStreak(userId);

  db.prepare(`UPDATE users SET totalMinutes = totalMinutes + ?, totalCalories = totalCalories + ?,
    totalExercises = totalExercises + 1, coins = coins + ?, seasonPoints = seasonPoints + ? WHERE id = ?`)
    .run(duration, calories, coinsEarned, expEarned, userId);

  const user = getUserById(userId);

  // Auto-create social post for significant activities
  if (duration >= 30) {
    const postId = uuid();
    db.prepare(`INSERT INTO social_posts (id, userId, content, activityId) VALUES (?,?,?,?)`)
      .run(postId, userId, `完成了${duration}分钟的${config.name}训练！消耗${calories}卡路里 🔥`, activity.id);
  }

  return {
    activity: { ...activity, statGain: { type: config.stat, gain: statGain } },
    levelResult,
    streak,
    user,
  };
}

export function getUserActivities(userId, limit = 30) {
  return db.prepare(
    'SELECT * FROM activities WHERE userId = ? ORDER BY createdAt DESC LIMIT ?'
  ).all(userId, limit);
}

export function getActivityCalendar(userId, year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  const activities = db.prepare(
    `SELECT date(createdAt) as date, SUM(duration) as totalMinutes, COUNT(*) as count
     FROM activities WHERE userId = ? AND date(createdAt) BETWEEN ? AND ?
     GROUP BY date(createdAt)`
  ).all(userId, startDate, endDate);
  return activities;
}

export function getUserStats(userId, period = 'week') {
  const now = new Date();
  let startDate;
  if (period === 'week') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 1);
  } else {
    startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1);
  }
  const startStr = startDate.toISOString().slice(0, 10);

  const stats = db.prepare(
    `SELECT COUNT(*) as sessions, COALESCE(SUM(duration),0) as totalMinutes,
     COALESCE(SUM(calories),0) as totalCalories, COALESCE(SUM(expEarned),0) as totalExp
     FROM activities WHERE userId = ? AND date(createdAt) >= ?`
  ).get(userId, startStr);

  const topType = db.prepare(
    `SELECT type, COUNT(*) as cnt FROM activities WHERE userId = ? AND date(createdAt) >= ?
     GROUP BY type ORDER BY cnt DESC LIMIT 1`
  ).get(userId, startStr);

  return { ...stats, topType: topType?.type || null, period };
}
