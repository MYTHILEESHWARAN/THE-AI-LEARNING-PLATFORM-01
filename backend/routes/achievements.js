const express = require('express');
const verifyToken = require('../middleware/auth');
const { db } = require('../database');

const router = express.Router();

// Master list of achievements
const ALL_ACHIEVEMENTS = [
  { id: 'welcome', title: 'Welcome Aboard', description: 'Created an account on AI Learning Platform', icon: '🚀', category: 'onboarding' },
  { id: 'first_course', title: 'Curious Explorer', description: 'Enrolled in your first course', icon: '🎯', category: 'courses' },
  { id: 'lesson_master', title: 'Knowledge Seeker', description: 'Completed 10 lessons', icon: '📖', category: 'lessons' },
  { id: 'first_quiz', title: 'Quiz Rookie', description: 'Completed your first quiz', icon: '⚡', category: 'quizzes' },
  { id: 'perfect_score', title: 'Perfect 100', description: 'Scored 100% on any quiz', icon: '🌟', category: 'quizzes' },
  { id: 'task_crusher', title: 'Productivity Pro', description: 'Completed 5 study tasks in your planner', icon: '✅', category: 'planner' },
  { id: 'course_complete', title: 'Graduate', description: 'Completed all lessons in a course', icon: '🏆', category: 'courses' },
  { id: 'ai_scholar', title: 'AI Companion', description: 'Generated a study summary or used AI assistant', icon: '🤖', category: 'ai' }
];

// ─── GET /api/achievements ───────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const earned = await db.achievements.find({ user_id: req.user.id });
    const earnedMap = new Map(earned.map(e => [e.achievement_id, e.earned_at]));

    const result = ALL_ACHIEVEMENTS.map(ach => ({
      ...ach,
      earned: earnedMap.has(ach.id),
      earned_at: earnedMap.get(ach.id) || null
    }));

    const totalEarned = earned.length;
    const totalAvailable = ALL_ACHIEVEMENTS.length;
    const completionPercentage = Math.round((totalEarned / totalAvailable) * 100);

    res.json({
      success: true,
      total_earned: totalEarned,
      total_available: totalAvailable,
      completion_percentage: completionPercentage,
      achievements: result
    });
  } catch (err) {
    console.error('Achievements error:', err);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

module.exports = router;
