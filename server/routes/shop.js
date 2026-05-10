import { Router } from 'express';
import { getAllItems, getUserItems, buyItem, equipItem, useItem } from '../services/shopService.js';

const router = Router();

router.get('/items', (req, res) => {
  const items = getAllItems();
  res.json({ items });
});

router.get('/my-items/:userId', (req, res) => {
  const items = getUserItems(req.params.userId);
  res.json({ items });
});

router.post('/buy', (req, res) => {
  const { userId, itemId } = req.body;
  const result = buyItem(userId, itemId);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

router.post('/equip', (req, res) => {
  const { userId, userItemId } = req.body;
  const result = equipItem(userId, userItemId);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

router.post('/use', (req, res) => {
  const { userId, userItemId } = req.body;
  const result = useItem(userId, userItemId);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

export default router;
