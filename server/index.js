import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import activityRoutes from './routes/activity.js';
import achievementRoutes from './routes/achievement.js';
import socialRoutes from './routes/social.js';
import teamRoutes from './routes/team.js';
import pkRoutes from './routes/pk.js';
import shopRoutes from './routes/shop.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/achievement', achievementRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/pk', pkRoutes);
app.use('/api/shop', shopRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve React build in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`🏃 燃动Fit Server running on http://localhost:${PORT}`);
});
