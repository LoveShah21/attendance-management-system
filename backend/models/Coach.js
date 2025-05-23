const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
  coachId: {
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
  hourlyRate: {
    type: Number,
    required: true,
    default: 1500
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  outstandingSalary: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

// Generate coach ID before saving
coachSchema.pre('save', async function(next) {
  if (!this.coachId) {
    const count = await mongoose.model('Coach').countDocuments();
    this.coachId = `COA${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Coach', coachSchema);