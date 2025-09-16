const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');

// POST /api/employees/add
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

    res.status(201).json({ message: 'Employee added successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find().select('-password'); // exclude passwords
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


module.exports = router;
