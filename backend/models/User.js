const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String },
  userType: { 
    type: String, 
    enum: ['student', 'coach', 'admin'], 
    required: true,
    default: 'student'
  },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

// Remove the post-save hook from here
module.exports = mongoose.model('User', userSchema);