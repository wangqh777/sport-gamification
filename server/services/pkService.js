import db from '../db.js';
import { v4 as uuid } from 'uuid';
import { getPkRank } from './userService.js';

export function createPK(challengerId, challengedId, duration) {
  if (![15, 30, 60].includes(duration)) return { error: 'PK时长必须为15、30或60分钟' };
  if (challengerId === challengedId) return { error: '不能挑战自己' };

  const match = {
    id: uuid(),
    challengerId,
    challengedId,
    duration,
  };

  db.prepare(`INSERT INTO pk_matches (id, challengerId, challengedId, duration)
    VALUES (?,?,?,?)`).run(match.id, match.challengerId, match.challengedId, match.duration);

  return { match: db.prepare('SELECT * FROM pk_matches WHERE id = ?').get(match.id) };
}

export function respondPK(matchId, userId, accept) {
  const match = db.prepare('SELECT * FROM pk_matches WHERE id = ?').get(matchId);
  if (!match) return { error: 'PK不存在' };
  if (match.challengedId !== userId) return { error: '你没有权限操作这个PK' };
  if (match.status !== 'pending') return { error: 'PK已处理' };

  if (!accept) {
    db.prepare('UPDATE pk_matches SET status = ? WHERE id = ?').run('declined', matchId);
    return { match: db.prepare('SELECT * FROM pk_matches WHERE id = ?').get(matchId) };
  }

  db.prepare('UPDATE pk_matches SET status = ? WHERE id = ?').run('active', matchId);
  return { match: db.prepare('SELECT * FROM pk_matches WHERE id = ?').get(matchId) };
}

export function updatePKProgress(matchId, userId, progress) {
  const match = db.prepare('SELECT * FROM pk_matches WHERE id = ?').get(matchId);
  if (!match) return { error: 'PK不存在' };
  if (match.status !== 'active') return { error: 'PK未在进行中' };

  if (match.challengerId === userId) {
    db.prepare('UPDATE pk_matches SET challengerProgress = ? WHERE id = ?').run(progress, matchId);
  } else if (match.challengedId === userId) {
    db.prepare('UPDATE pk_matches SET challengedProgress = ? WHERE id = ?').run(progress, matchId);
  }

  // Check if PK is complete
  const updated = db.prepare('SELECT * FROM pk_matches WHERE id = ?').get(matchId);
  if (updated.challengerProgress >= match.duration && updated.challengedProgress >= match.duration) {
    resolvePK(matchId);
  }

  return { match: db.prepare('SELECT * FROM pk_matches WHERE id = ?').get(matchId) };
}

function resolvePK(matchId) {
  const match = db.prepare('SELECT * FROM pk_matches WHERE id = ?').get(matchId);
  if (!match || match.status !== 'active') return;

  const cProgress = match.challengerProgress;
  const dProgress = match.challengedProgress;

  // Winner is the one with more progress; tie goes to challenger
  const winnerId = cProgress >= dProgress ? match.challengerId : match.challengedId;
  const loserId = winnerId === match.challengerId ? match.challengedId : match.challengerId;

  db.prepare('UPDATE pk_matches SET status = ?, winnerId = ? WHERE id = ?').run('completed', winnerId, matchId);

  // Update PK scores and coins
  const winner = db.prepare('SELECT * FROM users WHERE id = ?').get(winnerId);
  const loser = db.prepare('SELECT * FROM users WHERE id = ?').get(loserId);

  const winnerPkScore = winner.pkScore + 50;
  const loserPkScore = Math.max(0, loser.pkScore - 20);
  const winnerCoins = winner.coins + 100;
  const loserCoins = Math.max(0, loser.coins - 30);

  db.prepare('UPDATE users SET pkScore = ?, pkRank = ?, coins = ?, seasonPoints = seasonPoints + 80 WHERE id = ?')
    .run(winnerPkScore, getPkRank(winnerPkScore), winnerCoins, winnerId);
  db.prepare('UPDATE users SET pkScore = ?, pkRank = ?, coins = ? WHERE id = ?')
    .run(loserPkScore, getPkRank(loserPkScore), loserCoins, loserId);

  // Auto post
  db.prepare('INSERT INTO social_posts (id, userId, content) VALUES (?,?,?)')
    .run(uuid(), winnerId, `在PK中战胜了对手！🏆 PK段位：${getPkRank(winnerPkScore)}`);
}

export function getUserPKs(userId) {
  return db.prepare(
    `SELECT * FROM pk_matches WHERE challengerId = ? OR challengedId = ? ORDER BY createdAt DESC LIMIT 30`
  ).all(userId, userId);
}

export function getActivePK(userId) {
  return db.prepare(
    `SELECT * FROM pk_matches WHERE (challengerId = ? OR challengedId = ?) AND status = 'active' ORDER BY createdAt DESC LIMIT 1`
  ).get(userId, userId);
}
