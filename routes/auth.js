const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // ✅ JWT
const User = require('../models/User');

// Secret key (use env var in production!)
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ----------------------
// Login
// ----------------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body; // removed acceptedTerms

  console.log('📥 Login attempt received');
  console.log('📧 Email:', email);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('✅ User found:', user.email);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('❌ Incorrect password for:', user.email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role !== 'admin') {
      console.log('❌ Access denied for non-admin user:', user.email);
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    if (user.status !== 'active') {
      console.log(`❌ User is not active (status = ${user.status}):`, user.email);
      return res.status(403).json({ message: `Account is ${user.status}` });
    }

    console.log('✅ Login successful for:', user.email);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Respond with token + user info
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      },
    });

  } catch (err) {
    console.error('💥 Server error during login:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ----------------------
// Register
// ----------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'client',
      status: 'pending', // default status
    });

    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (err) {
    console.error('💥 Registration error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;//update and paste full updated code 