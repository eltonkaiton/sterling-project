const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  phone:    { type: String },
  position: { type: String },
  password: { type: String, required: true },
  salary:   { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
