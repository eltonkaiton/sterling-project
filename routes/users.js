const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Claim = require('../models/Claim'); // Needed for claim deletion

// ==========================
// GET /api/users
// Get all users with optional status, search, pagination
// ==========================
router.get('/', async (req, res) => {
  const { status, search = '', page = 1, limit = 5 } = req.query;

  try {
    const query = {};
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const users = await User.find(query)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({ users, total });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================
// PATCH /api/users/:id/status
// Update user status (active, pending, blocked, etc.)
// ==========================
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ message: 'Status is required' });

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: `User status updated to "${status}"`,
      user
    });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================
// PUT /api/users/:id
// Edit user info (name, email, role)
// ==========================
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email, and role are required' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { name, email, role },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (err) {
    console.error('Error editing user:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================
// DELETE /api/users/:id
// Delete a user by ID
// ==========================
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully', user });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==========================
// DELETE /api/claims/:id
// Delete a claim by ID
// ==========================
router.delete('/claims/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const claim = await Claim.findByIdAndDelete(id);

    if (!claim) return res.status(404).json({ message: 'Claim not found' });

    res.json({ message: 'Claim deleted successfully', claim });
  } catch (err) {
    console.error('Error deleting claim:', err);
    res.status(500).json({ message: 'Failed to delete claim', error: err.message });
  }
});

module.exports = router;
