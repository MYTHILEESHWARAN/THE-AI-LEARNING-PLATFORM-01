const express = require('express');
const verifyToken = require('../middleware/auth');
const { db } = require('../database');

const router = express.Router();

// ─── GET /api/courses ─────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { category, level, search } = req.query;
    let query = {};
    if (category && category !== 'all') query.category = category;
    if (level && level !== 'all') query.level = level;

    let courses = await db.courses.find(query);

    if (search) {
      const s = search.toLowerCase();
      courses = courses.filter(c => 
        (c.title && c.title.toLowerCase().includes(s)) ||
        (c.description && c.description.toLowerCase().includes(s))
      );
    }

    // Enrich courses with enrollments & lesson counts
    const enrollments = await db.enrollments.find({ user_id: req.user.id });
    const enrolledCourseIds = new Set(enrollments.map(e => e.course_id));

    const enriched = await Promise.all(courses.map(async c => {
      const studentCount = await db.enrollments.count({ course_id: c._id });
      const lessonCount = await db.lessons.count({ course_id: c._id });
      return {
        ...c,
        id: c._id,
        student_count: studentCount,
        lesson_count: lessonCount,
        is_enrolled: enrolledCourseIds.has(c._id) ? 1 : 0
      };
    }));

    res.json({ success: true, courses: enriched });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// ─── GET /api/courses/:id ─────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const course = await db.courses.findOne({ _id: req.params.id });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const modules = await db.modules.find({ course_id: req.params.id }).sort({ order_index: 1 });
    const lessons = await db.lessons.find({ course_id: req.params.id }).sort({ order_index: 1 });
    const enrollment = await db.enrollments.findOne({ course_id: req.params.id, user_id: req.user.id });
    const completedProgress = await db.lessonProgress.find({ course_id: req.params.id, user_id: req.user.id, completed: 1 });
    const completedLessonIds = new Set(completedProgress.map(p => p.lesson_id));

    const modulesWithLessons = modules.map(m => ({
      ...m,
      id: m._id,
      lessons: lessons
        .filter(l => l.module_id === m._id)
        .map(l => ({
          ...l,
          id: l._id,
          completed: completedLessonIds.has(l._id) ? 1 : 0
        }))
    }));

    const totalLessons = lessons.length;
    const completedCount = completedLessonIds.size;
    const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    res.json({
      success: true,
      course: {
        ...course,
        id: course._id,
        is_enrolled: !!enrollment,
        enrolled_at: enrollment ? enrollment.enrolled_at : null,
        progress_percentage: progressPct,
        completed_lessons: completedCount,
        total_lessons: totalLessons,
        modules: modulesWithLessons
      }
    });
  } catch (err) {
    console.error('Get course detail error:', err);
    res.status(500).json({ error: 'Failed to fetch course detail' });
  }
});

// ─── POST /api/courses/:id/enroll ─────────────────────────────────────────────
router.post('/:id/enroll', verifyToken, async (req, res) => {
  try {
    const course = await db.courses.findOne({ _id: req.params.id });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const existing = await db.enrollments.findOne({ course_id: req.params.id, user_id: req.user.id });
    if (existing) return res.status(400).json({ error: 'Already enrolled in this course' });

    await db.enrollments.insert({
      user_id: req.user.id,
      course_id: req.params.id,
      user_course: `${req.user.id}_${req.params.id}`,
      enrolled_at: new Date().toISOString(),
      progress_percentage: 0
    });

    // Check enrollment achievement
    const totalEnrolled = await db.enrollments.count({ user_id: req.user.id });
    if (totalEnrolled === 1) {
      await db.achievements.insert({
        user_id: req.user.id,
        achievement_id: 'first_course',
        user_ach: `${req.user.id}_first_course`,
        earned_at: new Date().toISOString()
      }).catch(() => {}); // ignore duplicate
    }

    // Notification
    await db.notifications.insert({
      user_id: req.user.id,
      title: 'Course Enrolled! 🎓',
      message: `You have successfully enrolled in "${course.title}". Start learning now!`,
      type: 'course',
      created_at: new Date().toISOString(),
      is_read: 0
    });

    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (err) {
    console.error('Enroll error:', err);
    res.status(500).json({ error: 'Failed to enroll in course' });
  }
});

module.exports = router;
