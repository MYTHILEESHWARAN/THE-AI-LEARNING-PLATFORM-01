const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { db }   = require('../database');

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)     return res.status(400).json({ error: 'All fields are required.' });
    if (password.length < 6)             return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const existing = await db.users.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 12);
    const id     = `user_${Date.now()}`;
    const now    = new Date().toISOString();

    const newUser = await db.users.insert({
      _id: id, name: name.trim(), email: email.toLowerCase().trim(),
      password: hashed, role: 'student', bio: '', avatar: null, created_at: now, last_login: null
    });

    // Welcome notification & achievement
    await db.notifications.insert({ _id: `notif_${Date.now()}`, user_id: id, title: 'Welcome! 🎉', message: 'Start your learning journey by exploring our courses.', type: 'success', read: false, created_at: now });
    await db.achievements.insert({ _id: `ach_${Date.now()}`, user_id: id, achievement_id: 'first_login', title: 'Welcome Aboard', description: 'Created your account', icon: '🎉', earned_at: now, user_ach: `${id}_first_login` }).catch(() => {});

    const token = generateToken(newUser);
    res.status(201).json({ message: 'Account created!', token, user: { id, name: newUser.name, email: newUser.email, role: 'student' } });
  } catch (err) {
    console.error('[SIGNUP ERROR]', err);
    res.status(500).json({ error: 'Signup failed. Please try again.' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await db.users.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });

    await db.users.update({ _id: user._id }, { $set: { last_login: new Date().toISOString() } });

    const token = generateToken(user);
    res.json({ message: 'Login successful!', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;
