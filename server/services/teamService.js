import db from '../db.js';
import { v4 as uuid } from 'uuid';

export function createTeam(userId, name) {
  const memberIds = JSON.stringify([userId]);
  const team = {
    id: uuid(),
    name,
    leaderId: userId,
    memberIds,
    weekStart: getWeekStart().toISOString().slice(0, 10),
  };
  db.prepare(`INSERT INTO teams (id, name, leaderId, memberIds, weekStart)
    VALUES (?,?,?,?,?)`).run(team.id, team.name, team.leaderId, team.memberIds, team.weekStart);
  return getTeam(team.id);
}

export function joinTeam(userId, teamId) {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) return { error: '小队不存在' };

  const members = JSON.parse(team.memberIds);
  if (members.includes(userId)) return { error: '你已经在这个小队中' };
  if (members.length >= 4) return { error: '小队已满（最多4人）' };

  members.push(userId);
  db.prepare('UPDATE teams SET memberIds = ? WHERE id = ?').run(JSON.stringify(members), teamId);
  return getTeam(teamId);
}

export function leaveTeam(userId, teamId) {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) return { error: '小队不存在' };

  let members = JSON.parse(team.memberIds);
  members = members.filter(id => id !== userId);

  if (members.length === 0) {
    db.prepare('DELETE FROM teams WHERE id = ?').run(teamId);
    return { deleted: true };
  }

  const newLeader = team.leaderId === userId ? members[0] : team.leaderId;
  db.prepare('UPDATE teams SET memberIds = ?, leaderId = ? WHERE id = ?')
    .run(JSON.stringify(members), newLeader, teamId);

  return getTeam(teamId);
}

export function getTeam(teamId) {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) return null;

  const memberIds = JSON.parse(team.memberIds);
  const members = memberIds.map(id => {
    const u = db.prepare('SELECT id, username, level, avatar, title, streak, totalMinutes FROM users WHERE id = ?').get(id);
    const thisWeekMinutes = getTeamMemberWeekMinutes(id, team.weekStart);
    return { ...u, weekMinutes: thisWeekMinutes };
  });

  // Update team weekly progress from actual activities
  const weekStart = team.weekStart || getWeekStart().toISOString().slice(0, 10);
  const totalMinutes = members.reduce((s, m) => s + m.weekMinutes, 0);

  db.prepare('UPDATE teams SET weeklyProgress = ?, weekStart = ? WHERE id = ?')
    .run(totalMinutes, weekStart, teamId);

  // Get messages
  const messages = db.prepare(
    `SELECT tm.*, u.username, u.avatar FROM team_messages tm
     JOIN users u ON tm.userId = u.id
     WHERE tm.teamId = ? ORDER BY tm.createdAt DESC LIMIT 50`
  ).all(teamId);

  return { ...team, memberIds, members, weeklyProgress: totalMinutes, messages };
}

export function getLeaderboard() {
  const teams = db.prepare('SELECT * FROM teams').all();
  return teams.map(t => {
    const members = JSON.parse(t.memberIds);
    let totalWeekMinutes = 0;
    members.forEach(id => {
      totalWeekMinutes += getTeamMemberWeekMinutes(id, t.weekStart);
    });
    return { id: t.id, name: t.name, memberCount: members.length, weeklyProgress: totalWeekMinutes, weeklyGoal: t.weeklyGoal };
  }).sort((a, b) => b.weeklyProgress - a.weeklyProgress);
}

export function sendMessage(teamId, userId, content) {
  const id = uuid();
  db.prepare('INSERT INTO team_messages (id, teamId, userId, content) VALUES (?,?,?,?)')
    .run(id, teamId, userId, content);
  return { id, content };
}

export function getUserTeam(userId) {
  const teams = db.prepare('SELECT * FROM teams WHERE memberIds LIKE ?').all(`%${userId}%`);
  return teams.length > 0 ? getTeam(teams[0].id) : null;
}

// Helpers
function getWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1); // Monday
  d.setHours(0, 0, 0, 0);
  return d;
}

function getTeamMemberWeekMinutes(userId, weekStart) {
  const result = db.prepare(
    `SELECT COALESCE(SUM(duration), 0) as total FROM activities
     WHERE userId = ? AND date(createdAt) >= ?`
  ).get(userId, weekStart || getWeekStart().toISOString().slice(0, 10));
  return result.total;
}
