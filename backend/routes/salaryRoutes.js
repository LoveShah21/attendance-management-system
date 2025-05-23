const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// Protected admin routes
router.get('/total-pending', authMiddleware, adminMiddleware, salaryController.getTotalPendingSalary);
router.post('/pay', authMiddleware, adminMiddleware, salaryController.paySalary);
router.post('/pay-all', authMiddleware, adminMiddleware, salaryController.payAllSalaries);

module.exports = router;