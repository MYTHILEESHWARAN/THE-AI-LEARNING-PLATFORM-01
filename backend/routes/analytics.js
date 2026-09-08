const express = require('express');
const verifyToken = require('../middleware/auth');
const { db } = require('../database');

const router = express.Router();

// ─── GET /api/analytics ───────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Enrollments & Course Progress
    const enrollments = await db.enrollments.find({ user_id: userId });
    const totalEnrolled = enrollments.length;

    const courseProgressList = await Promise.all(enrollments.map(async e => {
      const course = await db.courses.findOne({ _id: e.course_id });
      const totalLessons = await db.lessons.count({ course_id: e.course_id });
      const completedLessons = await db.lessonProgress.count({
        user_id: userId,
        course_id: e.course_id,
        completed: 1
      });
      const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      return {
        course_id: e.course_id,
        course_title: course ? course.title : 'Course',
        category: course ? course.category : 'General',
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percentage: pct
      };
    }));

    // Completed courses count
    const completedCoursesCount = courseProgressList.filter(c => c.progress_percentage === 100).length;

    // Total lessons completed
    const totalLessonsCompleted = await db.lessonProgress.count({ user_id: userId, completed: 1 });

    // Quizzes attempted & average score
    const attempts = await db.quizAttempts.find({ user_id: userId });
    attempts.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

    const totalQuizzesTaken = attempts.length;
    const avgScore = totalQuizzesTaken > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / totalQuizzesTaken)
      : 0;

    // Study tasks stats
    const totalTasks = await db.studyTasks.count({ user_id: userId });
    const completedTasks = await db.studyTasks.count({ user_id: userId, completed: 1 });

    // Achievements earned
    const achievementsCount = await db.achievements.count({ user_id: userId });

    // Recent activity timeline
    const recentAttempts = attempts.slice(0, 5).map(a => ({
      type: 'quiz',
      title: `Completed Quiz (Score: ${a.percentage}%)`,
      date: a.completed_at
    }));

    const recentLessons = await db.lessonProgress.find({ user_id: userId, completed: 1 });
    recentLessons.sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0));
    
    const enrichedRecentLessons = await Promise.all(recentLessons.slice(0, 5).map(async l => {
      const lesson = await db.lessons.findOne({ _id: l.lesson_id });
      return {
        type: 'lesson',
        title: `Completed lesson: ${lesson ? lesson.title : 'Lesson'}`,
        date: l.completed_at
      };
    }));

    const timeline = [...recentAttempts, ...enrichedRecentLessons]
      .filter(item => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    // Mock weekly activity data for chart
    const weeklyData = [
      { day: 'Mon', hours: 1.5, lessons: 2 },
      { day: 'Tue', hours: 2.0, lessons: 3 },
      { day: 'Wed', hours: 0.8, lessons: 1 },
      { day: 'Thu', hours: 2.5, lessons: 4 },
      { day: 'Fri', hours: 1.2, lessons: 2 },
      { day: 'Sat', hours: 3.0, lessons: 5 },
      { day: 'Sun', hours: 2.2, lessons: 3 },
    ];

    res.json({
      success: true,
      analytics: {
        total_enrolled: totalEnrolled,
        completed_courses: completedCoursesCount,
        total_lessons_completed: totalLessonsCompleted,
        total_quizzes_taken: totalQuizzesTaken,
        average_quiz_score: avgScore,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        achievements_count: achievementsCount,
        course_progress: courseProgressList,
        quiz_attempts: attempts.slice(0, 10),
        weekly_activity: weeklyData,
        recent_activity: timeline
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
