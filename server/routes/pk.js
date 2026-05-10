import { Router } from 'express';
import { createPK, respondPK, updatePKProgress, getUserPKs, getActivePK } from '../services/pkService.js';

const router = Router();

router.get('/list/:userId', (req, res) => {
  const pks = getUserPKs(req.params.userId);
  res.json({ pks });
});

router.get('/active/:userId', (req, res) => {
  const pk = getActivePK(req.params.userId);
  res.json({ pk });
});

router.post('/create', (req, res) => {
  const { challengerId, challengedId, duration } = req.body;
  const result = createPK(challengerId, challengedId, duration);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

router.post('/respond', (req, res) => {
  const { matchId, userId, accept } = req.body;
  const result = respondPK(matchId, userId, accept);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

router.post('/progress', (req, res) => {
  const { matchId, userId, progress } = req.body;
  const result = updatePKProgress(matchId, userId, progress);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

export default router;
