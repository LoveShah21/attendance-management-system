const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Protected routes
router.get('/', authMiddleware, adminMiddleware, coachController.getAllCoaches);
router.get('/singleCoach', authMiddleware, coachController.getCoachById);
router.get('/count', authMiddleware, adminMiddleware, coachController.getCoachCount);
router.put('/:id/hourly-rate', authMiddleware, coachController.updateHourlyRate);
router.put('/:id', authMiddleware, adminMiddleware, coachController.updateCoach);
router.delete('/:id', authMiddleware, adminMiddleware, coachController.deleteCoach);


module.exports = router;