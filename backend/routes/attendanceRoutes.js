const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes
router.post('/mark', authMiddleware, attendanceController.markAttendance);
router.get('/student/:studentId', authMiddleware, attendanceController.getStudentAttendance);
router.get('/salary/:coachId', authMiddleware, attendanceController.calculateSalary);

module.exports = router;