import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'fitness.db'));

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 100,
    avatar TEXT DEFAULT '⚔️',
    title TEXT DEFAULT '初级冒险者',
    class TEXT DEFAULT 'warrior',
    stats TEXT DEFAULT '{"str":10,"end":10,"agi":10,"flex":10,"pow":10,"spi":10}',
    streak INTEGER DEFAULT 0,
    lastExerciseDate TEXT,
    totalMinutes INTEGER DEFAULT 0,
    totalCalories INTEGER DEFAULT 0,
    totalExercises INTEGER DEFAULT 0,
    pkScore INTEGER DEFAULT 1000,
    pkRank TEXT DEFAULT '青铜',
    seasonPoints INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    duration INTEGER NOT NULL,
    calories INTEGER NOT NULL,
    expEarned INTEGER DEFAULT 0,
    coinsEarned INTEGER DEFAULT 0,
    statGain TEXT DEFAULT '{}',
    note TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    achievementKey TEXT NOT NULL,
    unlockedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id),
    UNIQUE(userId, achievementKey)
  );

  CREATE TABLE IF NOT EXISTS friends (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    friendId TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (friendId) REFERENCES users(id),
    UNIQUE(userId, friendId)
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    leaderId TEXT NOT NULL,
    memberIds TEXT NOT NULL DEFAULT '[]',
    weeklyGoal INTEGER DEFAULT 300,
    weeklyProgress INTEGER DEFAULT 0,
    weekStart TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (leaderId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS team_messages (
    id TEXT PRIMARY KEY,
    teamId TEXT NOT NULL,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (teamId) REFERENCES teams(id)
  );

  CREATE TABLE IF NOT EXISTS pk_matches (
    id TEXT PRIMARY KEY,
    challengerId TEXT NOT NULL,
    challengedId TEXT NOT NULL,
    duration INTEGER NOT NULL,
    challengerProgress INTEGER DEFAULT 0,
    challengedProgress INTEGER DEFAULT 0,
    winnerId TEXT,
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (challengerId) REFERENCES users(id),
    FOREIGN KEY (challengedId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS match_requests (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT,
    timePreference TEXT,
    genderPreference TEXT DEFAULT 'any',
    status TEXT DEFAULT 'open',
    matchedUserId TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS shop_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    effect TEXT,
    rarity TEXT DEFAULT 'common',
    icon TEXT DEFAULT '📦',
    stock INTEGER DEFAULT -1,
    requirement TEXT
  );

  CREATE TABLE IF NOT EXISTS user_items (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    itemId TEXT NOT NULL,
    purchasedAt TEXT DEFAULT (datetime('now')),
    equipped INTEGER DEFAULT 0,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS social_posts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    activityId TEXT,
    achievementKey TEXT,
    likes TEXT DEFAULT '[]',
    comments TEXT DEFAULT '[]',
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

// Seed shop items if empty
const shopCount = db.prepare('SELECT COUNT(*) as count FROM shop_items').get();
if (shopCount.count === 0) {
  const items = [
    { id: 'exp_card_1h', name: '经验加成卡(1小时)', type: 'consumable', description: '运动经验翻倍，持续1小时', price: 200, effect: 'double_exp', rarity: 'common', icon: '⭐' },
    { id: 'exp_card_24h', name: '经验加成卡(24小时)', type: 'consumable', description: '运动经验翻倍，持续24小时', price: 800, effect: 'double_exp', rarity: 'rare', icon: '🌟' },
    { id: 'coin_card_1h', name: '金币加成卡(1小时)', type: 'consumable', description: '运动金币翻倍，持续1小时', price: 150, effect: 'double_coin', rarity: 'common', icon: '💰' },
    { id: 'coin_card_24h', name: '金币加成卡(24小时)', type: 'consumable', description: '运动金币翻倍，持续24小时', price: 600, effect: 'double_coin', rarity: 'rare', icon: '💎' },
    { id: 'avatar_flame', name: '烈焰头像框', type: 'avatar_frame', description: '酷炫的火焰边框', price: 500, effect: null, rarity: 'common', icon: '🔥' },
    { id: 'avatar_ice', name: '冰霜头像框', type: 'avatar_frame', description: '冷静的冰霜边框', price: 500, effect: null, rarity: 'common', icon: '❄️' },
    { id: 'avatar_gold', name: '黄金头像框', type: 'avatar_frame', description: '尊贵的金色边框', price: 1000, effect: null, rarity: 'rare', icon: '👑' },
    { id: 'title_runner', name: '追风者称号', type: 'title', description: '使用称号：追风者', price: 300, effect: null, rarity: 'common', icon: '🏃' },
    { id: 'title_beast', name: '猛兽称号', type: 'title', description: '使用称号：猛兽', price: 300, effect: null, rarity: 'common', icon: '🦁' },
    { id: 'title_legend', name: '传奇称号', type: 'title', description: '使用称号：传奇', price: 1200, effect: null, rarity: 'rare', icon: '🏆' },
    { id: 'streak_shield', name: '连击护盾', type: 'consumable', description: '断签时保护连击天数1次', price: 400, effect: 'streak_shield', rarity: 'rare', icon: '🛡️' },
  ];
  const insert = db.prepare('INSERT INTO shop_items (id, name, type, description, price, effect, rarity, icon) VALUES (?,?,?,?,?,?,?,?)');
  for (const item of items) {
    insert.run(item.id, item.name, item.type, item.description, item.price, item.effect, item.rarity, item.icon);
  }
}

export default db;
