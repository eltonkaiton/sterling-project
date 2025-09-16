const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ['admin', 'client', 'surveyor'],
    default: 'client'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'suspended', 'rejected'],
    default: 'pending'  // ✅ This is key
  },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
