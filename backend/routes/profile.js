const express = require('express');
const bcrypt = require('bcryptjs');
const verifyToken = require('../middleware/auth');
const { db } = require('../database');

const router = express.Router();

// ─── GET /api/profile ─────────────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await db.users.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalEnrolled = await db.enrollments.count({ user_id: req.user.id });
    const totalCompletedLessons = await db.lessonProgress.count({ user_id: req.user.id, completed: 1 });
    const totalQuizzes = await db.quizAttempts.count({ user_id: req.user.id });
    const achievementsCount = await db.achievements.count({ user_id: req.user.id });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio || '',
        avatar: user.avatar || '',
        created_at: user.created_at,
        stats: {
          courses_enrolled: totalEnrolled,
          lessons_completed: totalCompletedLessons,
          quizzes_taken: totalQuizzes,
          achievements_earned: achievementsCount
        }
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ─── PUT /api/profile ─────────────────────────────────────────────────────────
router.put('/', verifyToken, async (req, res) => {
  try {
    const { name, bio, avatar, current_password, new_password } = req.body;
    const user = await db.users.findOne({ _id: req.user.id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (bio !== undefined) updateFields.bio = bio.trim();
    if (avatar !== undefined) updateFields.avatar = avatar.trim();

    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ error: 'Current password is required to set new password' });
      }
      const match = await bcrypt.compare(current_password, user.password);
      if (!match) {
        return res.status(400).json({ error: 'Current password does not match' });
      }
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      updateFields.password = await bcrypt.hash(new_password, 12);
    }

    await db.users.update({ _id: req.user.id }, { $set: updateFields });
    const updated = await db.users.findOne({ _id: req.user.id });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        bio: updated.bio,
        avatar: updated.avatar
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
