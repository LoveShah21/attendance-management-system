const express = require('express');
const { registerUser, loginUser, getCurrentUser, updateUser, sendOtp, verifyOtp, resetPass } = require('../controllers/userController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware')

router.post('/register', registerUser);
router.post('/login', loginUser);
// router.post('/firebase-login', firebaseLogin);

//Protected route
router.get('/me',authMiddleware, getCurrentUser);
router.put('/update', authMiddleware, updateUser);

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPass);

module.exports = router;