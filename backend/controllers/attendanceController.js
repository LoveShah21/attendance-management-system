const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Coach = require('../models/Coach');
const Salary = require('../models/Salary');

// Mark attendance
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, status, sessionDuration, notes, coachId, date } = req.body;
    
    // Validate required fields
    if (!studentId || !status || !coachId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate student belongs to this coach
    const student = await Student.findOne({ _id: studentId, coachId });
    if (!student) {
      return res.status(403).json({ message: 'Student not assigned to you' });
    }

    // Check if attendance already exists for this student on this date
    const existingAttendance = await Attendance.findOne({ 
      studentId, 
      coachId,
      date: date ? new Date(date) : new Date() 
    });

    if (existingAttendance) {
      return res.status(409).json({ 
        message: 'Attendance already marked for this student on this date',
        existingAttendance
      });
    }

    const attendance = new Attendance({
      studentId,
      coachId,
      date: date ? new Date(date) : new Date(),
      status,
      sessionDuration: status === 'present' ? sessionDuration || 60 : 0,
      notes
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ 
      message: 'Failed to mark attendance',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Get attendance for student
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    let query = { studentId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .populate('coachId', 'name coachId');

    res.status(200).json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Calculate coach salary
exports.calculateSalary = async (req, res) => {
  try {
    const { coachId } = req.params;
    const { month, year } = req.query;

    // Validate inputs
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const coach = await Coach.findById(coachId);
    if (!coach) return res.status(404).json({ message: 'Coach not found' });

    // Get all attendance records for the period
    const allAttendance = await Attendance.find({
      coachId,
      status: 'present',
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Get IDs of already paid sessions
    const paidSessionIds = await getPaidSessionIds(coachId);
    
    // Filter out paid sessions
    const unpaidAttendance = await Attendance.find({
          coachId,
          status: 'present',
          _id: { $nin: await getPaidSessionIds(coachId) } // Exclude already paid sessions
        });

    // Calculate totals from unpaid sessions only
    const totalMinutes = unpaidAttendance.reduce(
      (sum, record) => sum + (record.sessionDuration || 0), 
      0
    );
    const totalHours = totalMinutes / 60;
    const calculatedSalary = totalHours * coach.hourlyRate;

    // Update coach's outstanding salary (only unpaid work)
    coach.outstandingSalary = calculatedSalary;
    await coach.save();

    res.status(200).json({
      coachId: coach._id,
      coachName: coach.name,
      month,
      year,
      totalSessions: unpaidAttendance.length,
      totalHours: parseFloat(totalHours.toFixed(2)),
      hourlyRate: coach.hourlyRate,
      calculatedSalary: parseFloat(calculatedSalary.toFixed(2)),
      outstandingSalary: coach.outstandingSalary,
      sessions: unpaidAttendance.map(record => ({
        date: record.date,
        sessionDuration: record.sessionDuration,
        hours: (record.sessionDuration / 60).toFixed(2),
        isPaid: paidSessionIds.includes(record._id.toString())
      }))
    });
  } catch (err) {
    console.error('Error calculating salary:', err);
    res.status(500).json({ 
      message: 'Failed to calculate salary',
      error: err.message 
    });
  }
};

// Helper function to get paid session IDs
async function getPaidSessionIds(coachId) {
  const paidSalaries = await Salary.find({ coachId, status: 'paid' });
  return paidSalaries.flatMap(salary => 
    salary.paidSessions.map(id => id.toString())
  );
}