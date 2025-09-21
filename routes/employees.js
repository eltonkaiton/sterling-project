const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');

// ✅ Add Employee
router.post('/add', async (req, res) => {
  try {
    const { fullName, email, phone, position, password, salary } = req.body;

    // Check if employee with same email exists
    const existing = await Employee.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Employee already exists' });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new employee
    const employee = new Employee({
      fullName,
      email,
      phone,
      position,
      password: hashedPassword,
      salary,
    });

    await employee.save();
    res.status(201).json({ message: 'Employee added successfully', employee });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Get Employees with Search + Pagination
router.get('/', async (req, res) => {
  try {
    const { search = '', page = 1, limit = 5 } = req.query;

    const query = {
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } },
      ],
    };

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .select('-password') // exclude password field
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      employees,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
