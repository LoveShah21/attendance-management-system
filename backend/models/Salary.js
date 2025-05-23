const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  transactionId: {
    type: String
  },
  paidSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attendance' }]
}, { timestamps: true });

// Index to ensure one salary record per coach per month
salarySchema.index({ coachId: 1, month: 1, year: 1 });

module.exports = mongoose.model('Salary', salarySchema);