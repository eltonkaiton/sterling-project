const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// ----------------------
// Register
// ----------------------
router.post('/register', async (req, res) => {
  try {
    let { name, email, password, role } = req.body;

    // Trim and sanitize
    name = name?.trim();
    email = email?.trim().toLowerCase();
    role = role || 'client'; // default role

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const newUser = new User({
      name,
      email,
      password, // pre-save hook will hash
      role,
      status: role === 'admin' ? 'active' : 'pending', // admins active by default
    });

    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        userId: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ----------------------
// Login
// ----------------------
router.post('/login', async (req, res) => {
  const { email, password, source } = req.body; // source: 'web' or 'mobile'

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    console.log(`🔐 Login attempt for: ${email} from ${source}`);

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('❌ Incorrect password');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check account status
    if (user.status !== 'active') {
      console.log(`⚠️ Account not active (${user.status})`);
      return res.status(403).json({ message: `Account is currently ${user.status}.` });
    }

    // Web login restriction
    if (source === 'web' && user.role !== 'admin') {
      console.log(`🚫 Web login denied for role: ${user.role}`);
      return res.status(403).json({ message: 'Only admins can log in via web' });
    }

    // ✅ Mobile login allowed roles (added loss_adjuster)
    if (source === 'mobile' && !['client', 'surveyor', 'claim_analyst', 'loss_adjuster'].includes(user.role)) {
      console.log(`🚫 Mobile login denied for role: ${user.role}`);
      return res.status(403).json({ 
        message: 'Access denied: Only clients, surveyors, claim analysts, or loss adjusters can log in via mobile' 
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ Login successful for ${user.role}: ${user.name}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('🔥 Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
