const mongoose = require('mongoose');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('coachId', 'name coachId')
      .select('-__v');
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('coachId', 'name coachId');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Assign student to coach
exports.assignCoach = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { coachId } = req.body;
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }
    
    if (!coachId || !mongoose.Types.ObjectId.isValid(coachId)) {
      return res.status(400).json({ message: 'Invalid or missing coach ID' });
    }
    
    // Check if student exists
    const existingStudent = await Student.findById(studentId);
    
    if (!existingStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if coach exists
    const coach = await mongoose.model('Coach').findById(coachId);
    
    if (!coach) {
      return res.status(404).json({ message: 'Coach not found' });
    }
    
    // Handle case where the student already has a coach assigned
    if (existingStudent.coachId && existingStudent.coachId.toString() !== coachId) {
      // Get the previous coach ID to remove student from their students array
      const previousCoachId = existingStudent.coachId;
      
      // Remove student from previous coach's students array
      await mongoose.model('Coach').findByIdAndUpdate(
        previousCoachId,
        { $pull: { students: studentId } },
        { new: true }
      );
    }
    
    // Update student with new coach ID
    const student = await Student.findByIdAndUpdate(
      studentId,
      { coachId },
      { new: true }
    ).populate('coachId', 'name coachId');
    
    // Add student to new coach's students array (using $addToSet to prevent duplicates)
    await mongoose.model('Coach').findByIdAndUpdate(
      coachId,
      { $addToSet: { students: studentId } },
      { new: true }
    );
    
    res.status(200).json(student);
  } catch (err) {
    console.error('Error in assignCoach:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.unassignCoach = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Validate student ID
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }
    
    // Check if student exists and has a coach
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if the student has a coach assigned
    if (!student.coachId) {
      return res.status(400).json({ message: 'This student does not have a coach assigned' });
    }
    
    // Store coach ID before removing it
    const previousCoachId = student.coachId;
    
    // Unassign coach from student
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      { $unset: { coachId: "" } },  // Using $unset to completely remove the field
      { new: true }
    );
    
    // Remove student from coach's students array
    await mongoose.model('Coach').findByIdAndUpdate(
      previousCoachId,
      { $pull: { students: studentId } },
      { new: true }
    );
    
    res.status(200).json(updatedStudent);
    
  } catch (error) {
    console.error('Error in unassignCoach:', error);
    res.status(500).json({ message: error.message });
  }
};


exports.getStudentAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const student = await Student.findOne({ userId: userId });
    
    if (!student) {
      return res.status(404).json({ 
        message: "Student profile not found for this user" 
      });
    }

    const { filter } = req.query;
    
    let startDate = new Date();
    const endDate = new Date();
    
    switch(filter) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      default:
        // Default to current month
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    }

    // Normalize dates to beginning of day for comparison
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      studentId: student._id,
      date: { 
        $gte: startDate, 
        $lte: endDate 
      }
    })
    .sort({ date: -1 })
    .lean(); // Using lean() for better performance

    const presentRecords = attendanceRecords.filter(record => record.status === 'present');
    const absentRecords = attendanceRecords.filter(record => record.status === 'absent');
    const leaveRecords = attendanceRecords.filter(record => record.status === 'leave');
    
    let totalDays;
    if (filter === 'week') {
      totalDays = 7;
    } else if (filter === 'month') {
      // Calculate actual days in the date range
      totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      // Default to current month's days
      const currentDate = new Date();
      totalDays = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate();
    }

    res.status(200).json({
      attendance: attendanceRecords,
      stats: {
        present: presentRecords.length,
        absent: absentRecords.length,
        leave: leaveRecords.length,
        totalDays: totalDays,
        percentage: totalDays > 0 ? 
          (presentRecords.length / totalDays * 100).toFixed(2) : 0,
        totalDuration: presentRecords.reduce(
          (sum, record) => sum + (record.sessionDuration || 0), 0
        ),
        startDate: startDate,
        endDate: endDate
      }
    });

  } catch (err) {
    console.error('Attendance fetch error:', err);
    res.status(500).json({ 
      message: "Error fetching attendance records",
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.getStudentCount = async (req, res) => {
  try {
    const count = await Student.countDocuments();
    res.status(200).json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


