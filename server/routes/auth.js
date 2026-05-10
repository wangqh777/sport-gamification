import { Router } from 'express';
import { register, login, getUserById, searchUsers, getLeaderboard } from '../services/userService.js';

const router = Router();

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  if (username.length < 2 || username.length > 12) return res.status(400).json({ error: '用户名长度2-12位' });
  const result = register(username, password);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
  const result = login(username, password);
  if (result.error) return res.status(401).json({ error: result.error });
  res.json(result);
});

router.get('/user/:id', (req, res) => {
  const user = getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user });
});

router.get('/search', (req, res) => {
  const { keyword, userId } = req.query;
  if (!keyword) return res.json({ users: [] });
  const users = searchUsers(keyword, userId);
  res.json({ users });
});

router.get('/leaderboard', (req, res) => {
  const list = getLeaderboard();
  res.json({ leaderboard: list });
});

export default router;
