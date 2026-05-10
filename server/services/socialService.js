import db from '../db.js';
import { v4 as uuid } from 'uuid';

// ---- Friends ----
export function addFriend(userId, friendId) {
  if (userId === friendId) return { error: '不能添加自己为好友' };
  const existing = db.prepare('SELECT * FROM friends WHERE userId = ? AND friendId = ?').get(userId, friendId);
  if (existing) return { error: '已经是好友了' };

  db.prepare('INSERT INTO friends (id, userId, friendId) VALUES (?,?,?)').run(uuid(), userId, friendId);
  db.prepare('INSERT INTO friends (id, userId, friendId) VALUES (?,?,?)').run(uuid(), friendId, userId);

  return { success: true };
}

export function removeFriend(userId, friendId) {
  db.prepare('DELETE FROM friends WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)')
    .run(userId, friendId, friendId, userId);
  return { success: true };
}

export function getFriends(userId) {
  const friends = db.prepare(
    `SELECT u.id, u.username, u.level, u.avatar, u.title, u.streak, u.totalMinutes, u.stats, u.lastExerciseDate
     FROM friends f JOIN users u ON f.friendId = u.id WHERE f.userId = ?`
  ).all(userId);
  return friends.map(f => ({ ...f, stats: JSON.parse(f.stats || '{}') }));
}

// ---- Social Feed ----
export function getFeed(userId) {
  const friendIds = db.prepare('SELECT friendId FROM friends WHERE userId = ?').all(userId).map(f => f.friendId);
  friendIds.push(userId); // include self

  const posts = db.prepare(
    `SELECT sp.*, u.username, u.avatar, u.level, u.title FROM social_posts sp
     JOIN users u ON sp.userId = u.id
     WHERE sp.userId IN (${friendIds.map(()=>'?').join(',')})
     ORDER BY sp.createdAt DESC LIMIT 40`
  ).all(...friendIds);

  return posts.map(p => ({
    ...p,
    likes: JSON.parse(p.likes || '[]'),
    comments: JSON.parse(p.comments || '[]'),
  }));
}

export function toggleLike(postId, userId) {
  const post = db.prepare('SELECT * FROM social_posts WHERE id = ?').get(postId);
  if (!post) return { error: '动态不存在' };

  const likes = JSON.parse(post.likes || '[]');
  const idx = likes.indexOf(userId);
  if (idx >= 0) {
    likes.splice(idx, 1);
  } else {
    likes.push(userId);
  }
  db.prepare('UPDATE social_posts SET likes = ? WHERE id = ?').run(JSON.stringify(likes), postId);
  return { likes };
}

export function addComment(postId, userId, content) {
  const post = db.prepare('SELECT * FROM social_posts WHERE id = ?').get(postId);
  if (!post) return { error: '动态不存在' };

  const comments = JSON.parse(post.comments || '[]');
  comments.push({
    id: uuid(),
    userId,
    content,
    createdAt: new Date().toISOString(),
  });
  db.prepare('UPDATE social_posts SET comments = ? WHERE id = ?').run(JSON.stringify(comments), postId);
  return { comments };
}

// ---- Anonymous Match (匿名约跑) ----
export function createMatchRequest(userId, { type, location, timePreference, genderPreference }) {
  const id = uuid();
  db.prepare(`INSERT INTO match_requests (id, userId, type, location, timePreference, genderPreference)
    VALUES (?,?,?,?,?,?)`).run(id, userId, type, location, timePreference, genderPreference || 'any');
  return { id };
}

export function findMatch(userId) {
  // Simple matching: find an open request from a different user
  const myRequest = db.prepare('SELECT * FROM match_requests WHERE userId = ? AND status = ? ORDER BY createdAt DESC LIMIT 1')
    .get(userId, 'open');
  if (!myRequest) return { error: '请先发布约跑请求' };

  const match = db.prepare(
    `SELECT mr.*, u.username, u.avatar, u.level, u.totalMinutes, u.stats FROM match_requests mr
     JOIN users u ON mr.userId = u.id
     WHERE mr.userId != ? AND mr.status = 'open' AND mr.type = ?
     ORDER BY mr.createdAt ASC LIMIT 1`
  ).get(userId, myRequest.type);

  if (match) {
    db.prepare('UPDATE match_requests SET status = ?, matchedUserId = ? WHERE id = ?')
      .run('matched', userId, match.id);
    db.prepare('UPDATE match_requests SET status = ?, matchedUserId = ? WHERE id = ?')
      .run('matched', match.userId, myRequest.id);
    return { match: { ...match, stats: JSON.parse(match.stats || '{}') }, myRequestId: myRequest.id };
  }

  return { waiting: true, myRequestId: myRequest.id };
}
