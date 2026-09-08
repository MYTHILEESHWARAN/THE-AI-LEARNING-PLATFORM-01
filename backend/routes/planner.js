const express = require('express');
const verifyToken = require('../middleware/auth');
const { db } = require('../database');

const router = express.Router();

// ─── GET /api/planner/tasks ───────────────────────────────────────────────────
router.get('/tasks', verifyToken, async (req, res) => {
  try {
    const tasks = await db.studyTasks.find({ user_id: req.user.id });
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed - b.completed;
      return new Date(a.due_date) - new Date(b.due_date);
    });

    res.json({
      success: true,
      tasks: tasks.map(t => ({ ...t, id: t._id }))
    });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch study tasks' });
  }
});

// ─── POST /api/planner/tasks ──────────────────────────────────────────────────
router.post('/tasks', verifyToken, async (req, res) => {
  try {
    const { title, description, due_date, priority, subject, duration_minutes } = req.body;
    if (!title || !due_date) {
      return res.status(400).json({ error: 'Title and due date are required' });
    }

    const task = await db.studyTasks.insert({
      user_id: req.user.id,
      title: title.trim(),
      description: (description || '').trim(),
      due_date: due_date,
      priority: priority || 'medium',
      subject: subject || 'General',
      duration_minutes: parseInt(duration_minutes) || 30,
      completed: 0,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Study task created',
      task: { ...task, id: task._id }
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create study task' });
  }
});

// ─── PUT /api/planner/tasks/:id ───────────────────────────────────────────────
router.put('/tasks/:id', verifyToken, async (req, res) => {
  try {
    const { title, description, due_date, priority, subject, duration_minutes, completed } = req.body;
    const task = await db.studyTasks.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const updateFields = {};
    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (due_date !== undefined) updateFields.due_date = due_date;
    if (priority !== undefined) updateFields.priority = priority;
    if (subject !== undefined) updateFields.subject = subject;
    if (duration_minutes !== undefined) updateFields.duration_minutes = parseInt(duration_minutes);
    if (completed !== undefined) {
      updateFields.completed = completed ? 1 : 0;
      if (completed) updateFields.completed_at = new Date().toISOString();
    }

    await db.studyTasks.update({ _id: req.params.id }, { $set: updateFields });
    const updated = await db.studyTasks.findOne({ _id: req.params.id });

    // Achievement: Study Planner
    if (completed) {
      const completedCount = await db.studyTasks.count({ user_id: req.user.id, completed: 1 });
      if (completedCount === 5) {
        await db.achievements.insert({
          user_id: req.user.id,
          achievement_id: 'task_crusher',
          user_ach: `${req.user.id}_task_crusher`,
          earned_at: new Date().toISOString()
        }).catch(() => {});
      }
    }

    res.json({
      success: true,
      message: 'Task updated',
      task: { ...updated, id: updated._id }
    });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update study task' });
  }
});

// ─── DELETE /api/planner/tasks/:id ────────────────────────────────────────────
router.delete('/tasks/:id', verifyToken, async (req, res) => {
  try {
    const numRemoved = await db.studyTasks.remove({ _id: req.params.id, user_id: req.user.id }, {});
    if (numRemoved === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
