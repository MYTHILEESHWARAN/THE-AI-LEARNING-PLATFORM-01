require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { seedData } = require('./database');

const authRoutes      = require('./routes/auth');
const aiRoutes        = require('./routes/ai');
const uploadRoutes    = require('./routes/upload');
const courseRoutes    = require('./routes/courses');
const lessonRoutes    = require('./routes/lessons');
const quizRoutes      = require('./routes/quizzes');
const plannerRoutes   = require('./routes/planner');
const analyticsRoutes = require('./routes/analytics');
const achieveRoutes   = require('./routes/achievements');
const notifRoutes     = require('./routes/notifications');
const profileRoutes   = require('./routes/profile');
const adminRoutes     = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/auth',             authRoutes);
app.use('/api/courses',      courseRoutes);
app.use('/api/lessons',      lessonRoutes);
app.use('/api/quizzes',      quizRoutes);
app.use('/api/planner',      plannerRoutes);
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/achievements', achieveRoutes);
app.use('/api/notifications',notifRoutes);
app.use('/api/profile',      profileRoutes);
app.use('/api/admin',        adminRoutes);
app.use('/',                 aiRoutes);
app.use('/',                 uploadRoutes);

// SPA fallback - serve frontend pages
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  // Try to serve the specific HTML file, fallback to index
  const htmlFile = path.join(__dirname, '../frontend', req.path.endsWith('.html') ? req.path : req.path + '.html');
  const fs = require('fs');
  if (fs.existsSync(htmlFile)) {
    res.sendFile(htmlFile);
  } else {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

async function startServer() {
  try {
    await seedData();
    app.listen(PORT, () => {
      console.log(`
  ╔══════════════════════════════════════════╗
  ║   🚀 AI Learning Platform v2.0          ║
  ║   http://localhost:${PORT}               ║
  ║                                          ║
  ║   👤 student@demo.com / student123       ║
  ║   👑 admin@demo.com   / admin123         ║
  ╚══════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('[STARTUP ERROR]', err);
    process.exit(1);
  }
}

startServer();
