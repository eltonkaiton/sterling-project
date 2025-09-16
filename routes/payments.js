const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// POST /api/payments → Add a new payment
router.post('/', async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json({ message: 'Payment created', payment });
  } catch (err) {
    res.status(500).json({ message: 'Error creating payment', error: err.message });
  }
});

// GET /api/payments → List with search + pagination
router.get('/', async (req, res) => {
  const { search = '', page = 1, limit = 10 } = req.query;

  const query = search
    ? {
        $or: [
          { reference: new RegExp(search, 'i') },
          { claimant: new RegExp(search, 'i') }
        ]
      }
    : {};

  try {
    const payments = await Payment.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching payments', error: err.message });
  }
});

// DELETE /api/payments/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Payment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting payment', error: err.message });
  }
});

module.exports = router;
