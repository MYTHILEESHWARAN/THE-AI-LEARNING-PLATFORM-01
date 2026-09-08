const express = require('express');
const verifyToken = require('../middleware/auth');
const { db } = require('../database');

const router = express.Router();

// ─── GET /api/quizzes ─────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const quizzes = await db.quizzes.find({});

    const enriched = await Promise.all(quizzes.map(async q => {
      const questionCount = await db.questions.count({ quiz_id: q._id });
      const userAttempts = await db.quizAttempts.find({ quiz_id: q._id, user_id: req.user.id });
      const bestScore = userAttempts.length > 0 
        ? Math.max(...userAttempts.map(a => a.percentage)) 
        : null;

      let courseTitle = null;
      if (q.course_id) {
        const course = await db.courses.findOne({ _id: q.course_id });
        if (course) courseTitle = course.title;
      }

      return {
        ...q,
        id: q._id,
        course_title: courseTitle,
        question_count: questionCount,
        attempts_count: userAttempts.length,
        best_score: bestScore
      };
    }));

    res.json({ success: true, quizzes: enriched });
  } catch (err) {
    console.error('Get quizzes error:', err);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// ─── GET /api/quizzes/attempts ────────────────────────────────────────────────
router.get('/attempts', verifyToken, async (req, res) => {
  try {
    const attempts = await db.quizAttempts.find({ user_id: req.user.id });
    attempts.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

    const enriched = await Promise.all(attempts.map(async a => {
      const quiz = await db.quizzes.findOne({ _id: a.quiz_id });
      return {
        ...a,
        id: a._id,
        quiz_title: quiz ? quiz.title : 'General Quiz'
      };
    }));

    res.json({ success: true, attempts: enriched });
  } catch (err) {
    console.error('Get attempts error:', err);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

// ─── GET /api/quizzes/:id ─────────────────────────────────────────────────────
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const quiz = await db.quizzes.findOne({ _id: req.params.id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = await db.questions.find({ quiz_id: req.params.id });
    const sanitizedQuestions = questions.map(q => {
      let options = q.options;
      if (typeof options === 'string') {
        try { options = JSON.parse(options); } catch (e) { options = []; }
      }
      return {
        id: q._id,
        question_text: q.question_text,
        options: options,
        explanation: q.explanation
      };
    });

    res.json({
      success: true,
      quiz: {
        ...quiz,
        id: quiz._id,
        questions: sanitizedQuestions
      }
    });
  } catch (err) {
    console.error('Get quiz detail error:', err);
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// ─── POST /api/quizzes/:id/attempt ───────────────────────────────────────────
router.post('/:id/attempt', verifyToken, async (req, res) => {
  try {
    const { answers, time_spent_seconds } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Answers object required' });
    }

    const quiz = await db.quizzes.findOne({ _id: req.params.id });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = await db.questions.find({ quiz_id: req.params.id });
    let score = 0;
    const total = questions.length;
    const results = [];

    questions.forEach(q => {
      const userAnswer = parseInt(answers[q._id] !== undefined ? answers[q._id] : answers[q.id]);
      const isCorrect = userAnswer === q.correct_option;
      if (isCorrect) score++;

      let options = q.options;
      if (typeof options === 'string') {
        try { options = JSON.parse(options); } catch (e) {}
      }

      results.push({
        question_id: q._id,
        question_text: q.question_text,
        user_answer: userAnswer,
        correct_option: q.correct_option,
        is_correct: isCorrect,
        explanation: q.explanation,
        options: options
      });
    });

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    const attempt = await db.quizAttempts.insert({
      user_id: req.user.id,
      quiz_id: req.params.id,
      score: score,
      total_questions: total,
      percentage: percentage,
      time_spent_seconds: time_spent_seconds || 0,
      completed_at: new Date().toISOString()
    });

    // Achievement: First Quiz
    const totalAttempts = await db.quizAttempts.count({ user_id: req.user.id });
    if (totalAttempts === 1) {
      await db.achievements.insert({
        user_id: req.user.id,
        achievement_id: 'first_quiz',
        user_ach: `${req.user.id}_first_quiz`,
        earned_at: new Date().toISOString()
      }).catch(() => {});
    }

    // Achievement: Perfect Score
    if (percentage === 100) {
      await db.achievements.insert({
        user_id: req.user.id,
        achievement_id: 'perfect_score',
        user_ach: `${req.user.id}_perfect_score`,
        earned_at: new Date().toISOString()
      }).catch(() => {});
    }

    res.json({
      success: true,
      attempt_id: attempt._id,
      score: score,
      total_questions: total,
      percentage: percentage,
      results: results
    });
  } catch (err) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ error: 'Failed to submit quiz attempt' });
  }
});

module.exports = router;
