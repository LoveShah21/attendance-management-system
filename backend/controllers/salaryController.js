const mongoose = require('mongoose');
const Salary = require('../models/Salary');
const Coach = require('../models/Coach');
const Attendance = require('../models/Attendance');

// Calculate and get total pending salary
exports.getTotalPendingSalary = async (req, res) => {
  try {
    const coaches = await Coach.find({ outstandingSalary: { $gt: 0 } });
    const totalPending = coaches.reduce(
      (sum, coach) => sum + coach.outstandingSalary, 
      0
    );
    res.status(200).json({ total: totalPending });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Pay salary for a specific coach
exports.paySalary = async (req, res) => {
  const { coachId } = req.body;
  
  try {
    const coach = await Coach.findById(coachId);
    if (!coach) return res.status(404).json({ message: 'Coach not found' });
    if (coach.outstandingSalary <= 0) {
      return res.status(400).json({ message: 'No outstanding salary to pay' });
    }

    // Get all unpaid attendance records
    const unpaidAttendance = await Attendance.find({
      coachId,
      status: 'present',
      _id: { $nin: await getPaidSessionIds(coachId) } // Exclude already paid sessions
    });

    const currentDate = new Date();
    const salary = new Salary({
      coachId,
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      amount: coach.outstandingSalary,
      status: 'paid',
      paymentDate: currentDate,
      paidSessions: unpaidAttendance.map(session => session._id) // Mark these as paid
    });

    await salary.save();

    // Reset outstanding salary
    coach.outstandingSalary = 0;
    await coach.save();

    res.status(200).json({ 
      message: 'Salary paid successfully',
      salary
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Helper function to get all paid session IDs for a coach
async function getPaidSessionIds(coachId) {
  const paidSalaries = await Salary.find({ coachId, status: 'paid' });
  return paidSalaries.flatMap(salary => salary.paidSessions);
}

// Pay all outstanding salaries
exports.payAllSalaries = async (req, res) => {
  try {
    const coaches = await Coach.find({ outstandingSalary: { $gt: 0 } });
    const currentDate = new Date();

    const results = await Promise.all(
      coaches.map(async (coach) => {
        const unpaidAttendance = await Attendance.find({
          coachId: coach._id,
          status: 'present',
          _id: { $nin: await getPaidSessionIds(coach._id) }
        });

        if (unpaidAttendance.length === 0) return null;

        const salary = new Salary({
          coachId: coach._id,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          amount: coach.outstandingSalary,
          status: 'paid',
          paymentDate: currentDate,
          paidSessions: unpaidAttendance.map(session => session._id)
        });

        await salary.save();
        coach.outstandingSalary = 0;
        await coach.save();

        return salary;
      })
    );

    const successfulPayments = results.filter(Boolean);
    res.status(200).json({
      message: `${successfulPayments.length} salaries paid successfully`,
      payments: successfulPayments
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Calculate monthly salary for all coaches (cron job)
exports.calculateMonthlySalaries = async () => {
  try {
    const coaches = await Coach.find().populate('students');
    
    for (const coach of coaches) {
      // Calculate salary based on attendance records
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const attendanceRecords = await Attendance.find({
        coachId: coach._id,
        date: { $gte: startDate, $lte: endDate },
        status: 'present'
      });
      
      const totalMinutes = attendanceRecords.reduce((sum, record) => sum + (record.sessionDuration || 0), 0);
      const totalHours = totalMinutes / 60;
      const monthlySalary = totalHours * coach.hourlyRate;
      
      if (monthlySalary > 0) {
        // Add to outstanding salary
        coach.outstandingSalary += monthlySalary;
        await coach.save();
        
        // Create pending salary record
        const salary = new Salary({
          coachId: coach._id,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          amount: monthlySalary,
          status: 'pending'
        });
        await salary.save();
      }
    }    
  } catch (err) {
    console.error('Error calculating monthly salaries:', err);
  }
};