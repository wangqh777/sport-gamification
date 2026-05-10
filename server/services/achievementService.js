import db from '../db.js';
import { v4 as uuid } from 'uuid';

// Four-tier achievement system
export const ACHIEVEMENT_DEFS = [
  // ---- 新手成就 ----
  { key:'first_exercise', name:'初次启程', desc:'完成第一次运动', icon:'🌟', tier:'novice' },
  { key:'first_checkin',  name:'首次打卡', desc:'连续运动2天',   icon:'📅', tier:'novice' },
  { key:'first_friend',   name:'找到伙伴', desc:'添加第一个好友', icon:'🤝', tier:'novice' },

  // ---- 日常成就 ----
  { key:'daily_30min',    name:'半小时战士', desc:'单次运动超过30分钟', icon:'⏱️', tier:'daily' },
  { key:'cal_500',        name:'燃脂新手',   desc:'累计消耗500卡路里', icon:'🔥', tier:'daily' },
  { key:'three_types',    name:'全面开花',   desc:'尝试过3种不同运动', icon:'🎯', tier:'daily' },
  { key:'friend_workout', name:'并肩作战',   desc:'和好友在同一天运动', icon:'👥', tier:'daily' },

  // ---- 挑战成就 ----
  { key:'streak_7',       name:'七日连击',   desc:'连续运动7天',    icon:'🔥', tier:'challenge' },
  { key:'streak_14',      name:'半月坚持',   desc:'连续运动14天',   icon:'💪', tier:'challenge' },
  { key:'streak_30',      name:'月度传说',   desc:'连续运动30天',   icon:'👑', tier:'challenge' },
  { key:'total_100km',    name:'百里之行',   desc:'累计运动100公里',icon:'🛣️', tier:'challenge' },
  { key:'total_1000min',  name:'千分钟俱乐部',desc:'累计运动1000分钟',icon:'⏰', tier:'challenge' },
  { key:'pk_10wins',      name:'十连胜',     desc:'PK获得10次胜利', icon:'⚔️', tier:'challenge' },
  { key:'team_weekly',    name:'最佳队友',   desc:'完成3次小队周任务',icon:'🤝', tier:'challenge' },

  // ---- 隐藏成就 ----
  { key:'early_bird',     name:'晨曦勇士',   desc:'在早上6点前完成运动', icon:'🌅', tier:'hidden' },
  { key:'night_owl',      name:'夜行动物',   desc:'在晚上11点后完成运动', icon:'🦉', tier:'hidden' },
  { key:'weekend_warrior',name:'周末战士',   desc:'周末两天都运动',     icon:'🎉', tier:'hidden' },
  { key:'variety_master', name:'全能选手',   desc:'尝试过所有运动类型', icon:'🌈', tier:'hidden' },
  { key:'social_butterfly',name:'社交达人',  desc:'和10个不同的人一起运动',icon:'🦋', tier:'hidden' },
];

export function getAchievementDefs() {
  return ACHIEVEMENT_DEFS;
}

export function getUserAchievements(userId) {
  return db.prepare('SELECT * FROM achievements WHERE userId = ?').all(userId);
}

// Check and unlock new achievements based on user state
export function checkAchievements(userId, extra = {}) {
  const earned = getUserAchievements(userId).map(a => a.achievementKey);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const activities = db.prepare('SELECT * FROM activities WHERE userId = ?').all(userId);
  const friendCount = db.prepare('SELECT COUNT(*) as count FROM friends WHERE userId = ?').get(userId).count;
  const today = new Date().toISOString().slice(0, 10);

  const newlyUnlocked = [];

  for (const def of ACHIEVEMENT_DEFS) {
    if (earned.includes(def.key)) continue;
    let unlocked = false;

    switch (def.key) {
      case 'first_exercise':
        unlocked = activities.length >= 1;
        break;
      case 'first_checkin':
        unlocked = user.streak >= 2;
        break;
      case 'first_friend':
        unlocked = friendCount >= 1;
        break;
      case 'daily_30min':
        unlocked = activities.some(a => a.duration >= 30);
        break;
      case 'cal_500':
        unlocked = user.totalCalories >= 500;
        break;
      case 'three_types': {
        const types = new Set(activities.map(a => a.type));
        unlocked = types.size >= 3;
        break;
      }
      case 'friend_workout': {
        const friendIds = db.prepare('SELECT friendId FROM friends WHERE userId = ?').all(userId).map(f => f.friendId);
        if (friendIds.length > 0) {
          const friendActivities = db.prepare(
            `SELECT userId FROM activities WHERE userId IN (${friendIds.map(()=>'?').join(',')}) AND date(createdAt) = ?`
          ).all(...friendIds, today);
          unlocked = friendActivities.length > 0;
        }
        break;
      }
      case 'streak_7':  unlocked = user.streak >= 7; break;
      case 'streak_14': unlocked = user.streak >= 14; break;
      case 'streak_30': unlocked = user.streak >= 30; break;
      case 'total_100km': {
        const runningMinutes = activities.filter(a => a.type === 'running' || a.type === 'cycling').reduce((s, a) => s + a.duration, 0);
        unlocked = runningMinutes * 0.15 >= 100; // ~9km/h estimate
        break;
      }
      case 'total_1000min':
        unlocked = user.totalMinutes >= 1000;
        break;
      case 'pk_10wins': {
        const wins = db.prepare('SELECT COUNT(*) as count FROM pk_matches WHERE winnerId = ?').get(userId).count;
        unlocked = wins >= 10;
        break;
      }
      case 'team_weekly': {
        const teamId = db.prepare('SELECT id FROM teams WHERE memberIds LIKE ?').get(`%${userId}%`)?.id;
        if (teamId) {
          const completions = db.prepare(
            'SELECT COUNT(*) as count FROM teams WHERE id = ? AND weeklyProgress >= weeklyGoal'
          ).get(teamId).count;
          unlocked = completions >= 3;
        }
        break;
      }
      case 'early_bird': {
        const hour = new Date().getHours();
        unlocked = hour < 6 && activities.some(a => a.createdAt?.slice(0,10) === today);
        break;
      }
      case 'night_owl': {
        const hour = new Date().getHours();
        unlocked = hour >= 23 && activities.some(a => a.createdAt?.slice(0,10) === today);
        break;
      }
      case 'weekend_warrior': {
        const d = new Date();
        const saturday = new Date(d);
        saturday.setDate(d.getDate() - d.getDay() + 6); // last Saturday
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        const satStr = saturday.toISOString().slice(0,10);
        const sunStr = sunday.toISOString().slice(0,10);
        unlocked = activities.some(a => a.createdAt?.slice(0,10) === satStr) &&
                   activities.some(a => a.createdAt?.slice(0,10) === sunStr);
        break;
      }
      case 'variety_master':
        unlocked = new Set(activities.map(a => a.type)).size >= 9;
        break;
      case 'social_butterfly': {
        const distinctPartners = new Set();
        const pks = db.prepare('SELECT challengerId, challengedId FROM pk_matches WHERE (challengerId = ? OR challengedId = ?) AND status = ?').all(userId, userId, 'completed');
        pks.forEach(p => distinctPartners.add(p.challengerId === userId ? p.challengedId : p.challengerId));
        unlocked = distinctPartners.size >= 10;
        break;
      }
    }

    if (unlocked) {
      db.prepare('INSERT INTO achievements (id, userId, achievementKey) VALUES (?,?,?)').run(uuid(), userId, def.key);
      newlyUnlocked.push(def);
      // Auto post
      db.prepare('INSERT INTO social_posts (id, userId, content, achievementKey) VALUES (?,?,?,?)')
        .run(uuid(), userId, `解锁了成就：${def.name}！${def.desc}`, def.key);
    }
  }

  return newlyUnlocked;
}

export function getAllAchievements(userId) {
  const earned = getUserAchievements(userId).map(a => a.achievementKey);
  return ACHIEVEMENT_DEFS.map(def => ({
    ...def,
    unlocked: earned.includes(def.key),
  }));
}
