const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    validate: {
      validator: function(v) {
        return v <= new Date();
      },
      message: 'Attendance date cannot be in the future'
    }
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'leave'],
    default: 'absent'
  },
  sessionDuration: {
    type: Number, // in minutes
    required: function() { return this.status === 'present'; }
  },
  notes: {
    type: String
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }  // Include virtuals when converting to JSON
});

// Virtual for duration in hours
attendanceSchema.virtual('durationHours').get(function() {
  return (this.sessionDuration / 60).toFixed(1);
});

// Compound index to prevent duplicate attendance for same student on same date
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

// Additional indexes for common query patterns
attendanceSchema.index({ coachId: 1, date: 1 });
attendanceSchema.index({ status: 1 });

// Optional: Normalize date to midnight
attendanceSchema.pre('save', function(next) {
  if (this.isModified('date')) {
    this.date.setHours(0, 0, 0, 0);
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);