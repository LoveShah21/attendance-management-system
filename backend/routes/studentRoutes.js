const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Protected routes
router.get('/', authMiddleware, adminMiddleware, studentController.getAllStudents);
router.get('/attendance', authMiddleware, studentController.getStudentAttendance);
router.get('/count',authMiddleware, adminMiddleware, studentController.getStudentCount);
router.get('/:id', authMiddleware, studentController.getStudentById);
router.put('/:studentId/assign-coach', authMiddleware, adminMiddleware, studentController.assignCoach);
router.put('/:studentId/unassign-coach', authMiddleware, adminMiddleware, studentController.unassignCoach);


module.exports = router;