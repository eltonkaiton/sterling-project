const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  claimant: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['bank', 'cheque', 'mpesa'], required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
});

module.exports = mongoose.model('Payment', PaymentSchema);
