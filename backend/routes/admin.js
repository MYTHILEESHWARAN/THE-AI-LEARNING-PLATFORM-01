const express = require('express');
const verifyToken = require('../middleware/auth');
const { requireAdmin } = require('../middleware/auth');
const { db } = require('../database');

const router = express.Router();

// Protect all admin routes
router.use(verifyToken);
router.use(requireAdmin);

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await db.users.count({});
    const totalCourses = await db.courses.count({});
    const totalEnrollments = await db.enrollments.count({});
    const totalLessons = await db.lessons.count({});
    const totalQuizzes = await db.quizzes.count({});
    const totalAttempts = await db.quizAttempts.count({});

    // Recent user registrations
    const users = await db.users.find({});
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recentUsers = users.slice(0, 5).map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at
    }));

    res.json({
      success: true,
      stats: {
        total_users: totalUsers,
        total_courses: totalCourses,
        total_enrollments: totalEnrollments,
        total_lessons: totalLessons,
        total_quizzes: totalQuizzes,
        total_attempts: totalAttempts,
        recent_users: recentUsers
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await db.users.find({});
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const enriched = await Promise.all(users.map(async u => {
      const enrollmentsCount = await db.enrollments.count({ user_id: u._id });
      const lessonsCount = await db.lessonProgress.count({ user_id: u._id, completed: 1 });
      const quizzesCount = await db.quizAttempts.count({ user_id: u._id });

      return {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
        courses_enrolled: enrollmentsCount,
        lessons_completed: lessonsCount,
        quizzes_taken: quizzesCount
      };
    }));

    res.json({ success: true, users: enriched });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── PUT /api/admin/users/:id/role ────────────────────────────────────────────
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be student or admin' });
    }

    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await db.users.update({ _id: req.params.id }, { $set: { role } });

    res.json({ success: true, message: `User role updated to ${role}` });
  } catch (err) {
    console.error('Admin update role error:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// ─── DELETE /api/admin/users/:id ──────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    const numRemoved = await db.users.remove({ _id: req.params.id }, {});
    if (numRemoved === 0) return res.status(404).json({ error: 'User not found' });

    // Clean up relations
    await db.enrollments.remove({ user_id: req.params.id }, { multi: true });
    await db.lessonProgress.remove({ user_id: req.params.id }, { multi: true });
    await db.quizAttempts.remove({ user_id: req.params.id }, { multi: true });
    await db.studyTasks.remove({ user_id: req.params.id }, { multi: true });
    await db.achievements.remove({ user_id: req.params.id }, { multi: true });
    await db.notifications.remove({ user_id: req.params.id }, { multi: true });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─── POST /api/admin/courses ──────────────────────────────────────────────────
router.post('/courses', async (req, res) => {
  try {
    const { title, description, category, level, duration_hours, thumbnail, instructor } = req.body;
    if (!title || !category || !level) {
      return res.status(400).json({ error: 'Title, category, and level are required' });
    }

    const newCourse = await db.courses.insert({
      title: title.trim(),
      description: (description || '').trim(),
      category: category.toLowerCase(),
      level: level.toLowerCase(),
      duration_hours: parseInt(duration_hours) || 10,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      instructor: instructor || 'AI Academy Instructor',
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Course created successfully',
      course: { ...newCourse, id: newCourse._id }
    });
  } catch (err) {
    console.error('Admin create course error:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

module.exports = router;
