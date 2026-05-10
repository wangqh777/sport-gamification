import { Router } from 'express';
import { getAllAchievements, checkAchievements, getAchievementDefs } from '../services/achievementService.js';

const router = Router();

router.get('/defs', (req, res) => {
  res.json({ achievements: getAchievementDefs() });
});

router.get('/user/:userId', (req, res) => {
  const list = getAllAchievements(req.params.userId);
  res.json({ achievements: list, unlocked: list.filter(a => a.unlocked).length, total: list.length });
});

router.post('/check/:userId', (req, res) => {
  const newlyUnlocked = checkAchievements(req.params.userId);
  res.json({ newlyUnlocked });
});

export default router;
