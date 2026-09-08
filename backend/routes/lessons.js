const express = require('express');
const verifyToken = require('../middleware/auth');
const { db } = require('../database');

const router = express.Router();

// ─── POST /api/lessons/:id/complete ───────────────────────────────────────────
router.post('/:id/complete', verifyToken, async (req, res) => {
  try {
    const lesson = await db.lessons.findOne({ _id: req.params.id });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const key = `${req.user.id}_${req.params.id}`;
    const existing = await db.lessonProgress.findOne({ user_lesson: key });

    if (!existing) {
      await db.lessonProgress.insert({
        user_id: req.user.id,
        course_id: lesson.course_id,
        lesson_id: lesson._id,
        user_lesson: key,
        completed: 1,
        completed_at: new Date().toISOString()
      });
    } else if (!existing.completed) {
      await db.lessonProgress.update({ _id: existing._id }, {
        $set: { completed: 1, completed_at: new Date().toISOString() }
      });
    }

    // Check course progress
    const totalCourseLessons = await db.lessons.count({ course_id: lesson.course_id });
    const completedCourseLessons = await db.lessonProgress.count({
      user_id: req.user.id,
      course_id: lesson.course_id,
      completed: 1
    });

    const progressPct = totalCourseLessons > 0 ? Math.round((completedCourseLessons / totalCourseLessons) * 100) : 0;

    await db.enrollments.update(
      { user_id: req.user.id, course_id: lesson.course_id },
      { $set: { progress_percentage: progressPct } }
    );

    // Check achievements
    const totalCompleted = await db.lessonProgress.count({ user_id: req.user.id, completed: 1 });
    if (totalCompleted === 10) {
      await db.achievements.insert({
        user_id: req.user.id,
        achievement_id: 'lesson_master',
        user_ach: `${req.user.id}_lesson_master`,
        earned_at: new Date().toISOString()
      }).catch(() => {});
    }

    if (progressPct >= 100) {
      await db.achievements.insert({
        user_id: req.user.id,
        achievement_id: 'course_complete',
        user_ach: `${req.user.id}_course_complete`,
        earned_at: new Date().toISOString()
      }).catch(() => {});

      await db.notifications.insert({
        user_id: req.user.id,
        title: 'Course Completed! 🏆',
        message: `Congratulations! You finished all lessons in the course!`,
        type: 'achievement',
        created_at: new Date().toISOString(),
        is_read: 0
      });
    }

    res.json({
      success: true,
      message: 'Lesson marked as complete',
      course_progress: progressPct,
      completed_lessons: completedCourseLessons,
      total_lessons: totalCourseLessons
    });
  } catch (err) {
    console.error('Complete lesson error:', err);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

// ─── GET /api/lessons/:id ─────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const lesson = await db.lessons.findOne({ _id: req.params.id });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const progress = await db.lessonProgress.findOne({ user_id: req.user.id, lesson_id: lesson._id });

    res.json({
      success: true,
      lesson: {
        ...lesson,
        id: lesson._id,
        completed: progress ? progress.completed : 0
      }
    });
  } catch (err) {
    console.error('Get lesson error:', err);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

module.exports = router;
