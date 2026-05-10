import { Router } from 'express';
import { createTeam, joinTeam, leaveTeam, getTeam, getLeaderboard, sendMessage, getUserTeam } from '../services/teamService.js';

const router = Router();

router.post('/create', (req, res) => {
  const { userId, name } = req.body;
  if (!name || name.length < 2) return res.status(400).json({ error: '队伍名称至少2个字' });
  // Check user isn't already in a team
  const existing = getUserTeam(userId);
  if (existing) return res.status(400).json({ error: '你已经在一个队伍中了，请先退出' });
  const team = createTeam(userId, name);
  res.json({ team });
});

router.post('/join', (req, res) => {
  const { userId, teamId } = req.body;
  const existing = getUserTeam(userId);
  if (existing) return res.status(400).json({ error: '你已经在一个队伍中了' });
  const result = joinTeam(userId, teamId);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ team: result });
});

router.post('/leave', (req, res) => {
  const { userId, teamId } = req.body;
  const result = leaveTeam(userId, teamId);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

router.get('/my/:userId', (req, res) => {
  const team = getUserTeam(req.params.userId);
  res.json({ team });
});

router.get('/:teamId', (req, res) => {
  const team = getTeam(req.params.teamId);
  if (!team) return res.status(404).json({ error: '队伍不存在' });
  res.json({ team });
});

router.get('/leaderboard', (req, res) => {
  const list = getLeaderboard();
  res.json({ leaderboard: list });
});

router.post('/message', (req, res) => {
  const { teamId, userId, content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: '消息不能为空' });
  const msg = sendMessage(teamId, userId, content);
  res.json(msg);
});

export default router;
