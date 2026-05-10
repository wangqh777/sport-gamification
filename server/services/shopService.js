import db from '../db.js';
import { v4 as uuid } from 'uuid';

export function getAllItems() {
  return db.prepare('SELECT * FROM shop_items ORDER BY rarity, price').all();
}

export function getUserItems(userId) {
  return db.prepare(
    `SELECT ui.*, si.name, si.type, si.description, si.effect, si.icon, si.rarity
     FROM user_items ui JOIN shop_items si ON ui.itemId = si.id
     WHERE ui.userId = ? ORDER BY ui.purchasedAt DESC`
  ).all(userId);
}

export function buyItem(userId, itemId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const item = db.prepare('SELECT * FROM shop_items WHERE id = ?').get(itemId);

  if (!item) return { error: '道具不存在' };
  if (user.coins < item.price) return { error: '金币不足' };

  // Check if already owned (for non-consumable items with stock tracking)
  if (item.type === 'avatar_frame' || item.type === 'title') {
    const existing = db.prepare('SELECT * FROM user_items WHERE userId = ? AND itemId = ?').get(userId, itemId);
    if (existing) return { error: '你已经拥有这个道具了' };
  }

  db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').run(item.price, userId);
  db.prepare('INSERT INTO user_items (id, userId, itemId) VALUES (?,?,?)').run(uuid(), userId, itemId);

  return { success: true, item, newBalance: user.coins - item.price };
}

export function equipItem(userId, userItemId) {
  const userItem = db.prepare(
    `SELECT ui.*, si.type, si.name FROM user_items ui JOIN shop_items si ON ui.itemId = si.id WHERE ui.id = ? AND ui.userId = ?`
  ).get(userItemId, userId);

  if (!userItem) return { error: '道具不存在' };

  // Unequip other items of same type
  db.prepare('UPDATE user_items SET equipped = 0 WHERE userId = ? AND itemId IN (SELECT id FROM shop_items WHERE type = ?)')
    .run(userId, userItem.type);

  // Equip this one
  db.prepare('UPDATE user_items SET equipped = 1 WHERE id = ?').run(userItemId);

  // Update user profile
  if (userItem.type === 'avatar_frame') {
    // Store equipped items in user profile
  } else if (userItem.type === 'title') {
    db.prepare('UPDATE users SET title = ? WHERE id = ?').run(userItem.name, userId);
  }

  return { success: true };
}

export function useItem(userId, userItemId) {
  const userItem = db.prepare(
    `SELECT ui.*, si.type, si.effect FROM user_items ui JOIN shop_items si ON ui.itemId = si.id WHERE ui.id = ? AND ui.userId = ?`
  ).get(userItemId, userId);

  if (!userItem) return { error: '道具不存在' };
  if (userItem.type !== 'consumable') return { error: '该道具无法使用' };

  // Apply effect
  if (userItem.effect === 'double_exp') {
    // Mark active buff (stored in-memory or in a buffs table)
    // For simplicity, we'll just remove the item and let the client handle the buff
  }

  db.prepare('DELETE FROM user_items WHERE id = ?').run(userItemId);
  return { success: true, effect: userItem.effect };
}
