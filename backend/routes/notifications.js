const express = require('express');
const verifyToken = require('../middleware/auth');
const { db } = require('../database');

const router = express.Router();

// ─── GET /api/notifications ───────────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await db.notifications.find({ user_id: req.user.id });
    notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.json({
      success: true,
      unread_count: unreadCount,
      notifications: notifications.map(n => ({ ...n, id: n._id }))
    });
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ─── PUT /api/notifications/:id/read ──────────────────────────────────────────
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    await db.notifications.update(
      { _id: req.params.id, user_id: req.user.id },
      { $set: { is_read: 1 } }
    );
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark notification read' });
  }
});

// ─── PUT /api/notifications/read-all ──────────────────────────────────────────
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await db.notifications.update(
      { user_id: req.user.id },
      { $set: { is_read: 1 } },
      { multi: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to mark all notifications read' });
  }
});

module.exports = router;
