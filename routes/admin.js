// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Claim = require('../models/Claim');
const Payment = require('../models/Payment');

// =============================
// GET /api/admin/users
// Fetch users with optional status, search, and pagination
// =============================
router.get('/users', async (req, res) => {
  const { status, search = '', page = 1, limit = 5 } = req.query;

  try {
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({ users, total });
  } catch (err) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
});

// =============================
// PATCH /api/admin/users/:id/status
// Update user status (active, rejected, suspended, etc.)
// =============================
router.patch('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ message: 'Status is required' });

  try {
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: `User status updated to "${status}"`, user });
  } catch (err) {
    console.error('Error updating user status:', err);
    res.status(500).json({ message: 'Failed to update user status', error: err.message });
  }
});

// =============================
// DELETE /api/admin/users/:id
// Delete a user
// =============================
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully', user });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Failed to delete user', error: err.message });
  }
});

// =============================
// GET /api/admin/summary
// Dashboard summary data
// =============================
router.get('/summary', async (req, res) => {
  try {
    // Users
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const suspendedUsers = await User.countDocuments({ status: 'suspended' });

    // Claims
    const totalClaims = await Claim.countDocuments();
    const pendingClaims = await Claim.countDocuments({ status: 'pending' });
    const approvedClaims = await Claim.countDocuments({ status: 'approved' });
    const rejectedClaims = await Claim.countDocuments({ status: 'rejected' });

    // Payments
    const totalPayments = await Payment.countDocuments();

    // ✅ Shape matches your AdminDashboard.jsx
    res.json({
      summary: {
        totalUsers,
        totalClaims,
        totalPayments,
        pendingClaims
      },
      claimsByStatus: [
        { status: 'Pending', count: pendingClaims },
        { status: 'Approved', count: approvedClaims },
        { status: 'Rejected', count: rejectedClaims }
      ],
      monthlyClaims: [], // 👉 You can add MongoDB aggregation later
      paymentsBreakdown: [
        { status: 'Payments', count: totalPayments }
      ]
    });
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ message: 'Failed to fetch summary', error: err.message });
  }
});

module.exports = router;
