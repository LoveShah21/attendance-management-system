// models/payment.model.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  amount: {
    type: Number,
    required: true,
    enum: [500, 3000]  // Only allowing these specific amounts
  },
  pgnFile: {
    type: String,  // Store the file path or URL
    required: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;