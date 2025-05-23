const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach'
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  },
  attendance: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendance'
  }]
}, { timestamps: true });

// Generate student ID before saving
studentSchema.pre('save', async function(next) {
  if (!this.studentId) {
    const count = await mongoose.model('Student').countDocuments();
    this.studentId = `STU${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);