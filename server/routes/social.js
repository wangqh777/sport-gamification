import { Router } from 'express';
import { addFriend, removeFriend, getFriends, getFeed, toggleLike, addComment, createMatchRequest, findMatch } from '../services/socialService.js';

const router = Router();

// Friends
router.post('/friend/add', (req, res) => {
  const { userId, friendId } = req.body;
  const result = addFriend(userId, friendId);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

router.post('/friend/remove', (req, res) => {
  const { userId, friendId } = req.body;
  const result = removeFriend(userId, friendId);
  res.json(result);
});

router.get('/friends/:userId', (req, res) => {
  const friends = getFriends(req.params.userId);
  res.json({ friends });
});

// Feed
router.get('/feed/:userId', (req, res) => {
  const posts = getFeed(req.params.userId);
  res.json({ posts });
});

router.post('/feed/like', (req, res) => {
  const { postId, userId } = req.body;
  const result = toggleLike(postId, userId);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

router.post('/feed/comment', (req, res) => {
  const { postId, userId, content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: '评论不能为空' });
  const result = addComment(postId, userId, content);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

// Anonymous Match
router.post('/match/create', (req, res) => {
  const { userId, type, location, timePreference, genderPreference } = req.body;
  const result = createMatchRequest(userId, { type, location, timePreference, genderPreference });
  res.json(result);
});

router.post('/match/find', (req, res) => {
  const { userId } = req.body;
  const result = findMatch(userId);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

export default router;
