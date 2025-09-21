// routes/payments.js
const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

// @route   POST /api/payments
// @desc    Create a new payment
router.post('/', async (req, res) => {
  try {
    const { reference, insured, date, amount, method } = req.body;

    const payment = new Payment({ reference, insured, date, amount, method });
    await payment.save();

    res.status(201).json({ message: 'Payment added successfully', payment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/payments
// @desc    Get payments with search + pagination
router.get('/', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 5 } = req.query;

    const query = {
      $or: [
        { reference: { $regex: search, $options: 'i' } },
        { insured: { $regex: search, $options: 'i' } },
        { method: { $regex: search, $options: 'i' } },
      ],
    };

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      payments,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   DELETE /api/payments/:id
// @desc    Delete a payment
router.delete('/:id', async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
