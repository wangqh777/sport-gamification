import { Router } from 'express';
import { getExerciseTypes, logActivity, getUserActivities, getActivityCalendar, getUserStats } from '../services/activityService.js';
import { checkAchievements } from '../services/achievementService.js';

const router = Router();

router.get('/types', (req, res) => {
  res.json({ types: getExerciseTypes() });
});

router.post('/log', (req, res) => {
  const { userId, type, duration, intensity, note } = req.body;
  if (!userId || !type || !duration) return res.status(400).json({ error: '缺少必要参数' });

  const result = logActivity(userId, { type, duration, intensity, note });
  if (result.error) return res.status(400).json({ error: result.error });

  // Check achievements after activity
  const newAchievements = checkAchievements(userId);

  res.json({
    ...result,
    newAchievements,
  });
});

router.get('/history/:userId', (req, res) => {
  const activities = getUserActivities(req.params.userId, parseInt(req.query.limit) || 30);
  res.json({ activities });
});

router.get('/calendar/:userId', (req, res) => {
  const now = new Date();
  const year = parseInt(req.query.year) || now.getFullYear();
  const month = parseInt(req.query.month) || (now.getMonth() + 1);
  const calendar = getActivityCalendar(req.params.userId, year, month);
  res.json({ calendar, year, month });
});

router.get('/stats/:userId', (req, res) => {
  const period = req.query.period || 'week';
  const stats = getUserStats(req.params.userId, period);
  res.json({ stats });
});

export default router;
