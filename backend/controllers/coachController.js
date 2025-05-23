const Coach = require('../models/Coach');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Get all coaches
exports.getAllCoaches = async (req, res) => {
  try {
    const coaches = await Coach.find()
      .populate('students', 'name studentId')
      .select('-__v');
    res.status(200).json(coaches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get coach by ID
exports.getCoachById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = req.user._id;
    const coach = await Coach.findOne({ userId }) 
      .populate('students', 'name studentId email joiningDate');
      
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }
    
    res.status(200).json(coach);
  } catch (err) {
    console.error('Error fetching coach:', err);
    res.status(500).json({ 
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};

// Update coach hourly rate
exports.updateHourlyRate = async (req, res) => {
  try {
    const { hourlyRate } = req.body;
    const coach = await Coach.findByIdAndUpdate(
      req.params.id,
      { hourlyRate },
      { new: true }
    );
    
    if (!coach) return res.status(404).json({ message: 'Coach not found' });
    res.status(200).json(coach);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCoachCount = async (req, res) => {
  try {
    const count = await Coach.countDocuments();
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCoach = async (req, res) => {
  try {
    const { name, email, hourlyRate, active } = req.body;
    const coachId = req.params.id;

    // Find coach first to check if it exists
    const existingCoach = await Coach.findById(coachId);
    if (!existingCoach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    // Check if email is being changed and if it's unique
    if (email && email !== existingCoach.email) {
      const emailExists = await Coach.findOne({ email, _id: { $ne: coachId } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use by another coach' });
      }
    }

    // Create update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (active !== undefined) updateData.active = active;

    // Update coach
    const updatedCoach = await Coach.findByIdAndUpdate(
      coachId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('students', 'name studentId');

    res.status(200).json(updatedCoach);
  } catch (err) {
    console.error('Error updating coach:', err);
    res.status(500).json({
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};

// Delete coach
exports.deleteCoach = async (req, res) => {
  try {
    const coachId = req.params.id;
    
    // Find coach first to check if it exists and get userId
    const coach = await Coach.findById(coachId);
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }

    // Check if coach has students
    if (coach.students && coach.students.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete coach with assigned students. Please reassign students first.' 
      });
    }

    // Check if coach has outstanding salary
    if (coach.outstandingSalary > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete coach with outstanding salary. Please clear payment first.' 
      });
    }

    // Store userId for later user update
    const userId = coach.userId;

    // Check for attendance records
    const attendanceRecords = await Attendance.find({ coachId: coachId });
    if (attendanceRecords.length > 0) {
      return res.status(400).json({
        message: 'Cannot delete coach with attendance records. Please archive the coach instead.'
      });
    }

    // Delete the coach
    await Coach.findByIdAndDelete(coachId);

    // Optionally update the associated user's role
    if (userId) {
      await User.findByIdAndDelete({_id: userId});
    }

    res.status(200).json({ message: 'Coach deleted successfully' });
  } catch (err) {
    console.error('Error deleting coach:', err);
    res.status(500).json({
      message: 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { error: err.message })
    });
  }
};
