// routes/payment.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const paymentController = require('../controllers/paymentController');

// Make sure uploads directory exists before setting up multer
const uploadsDir = path.join(__dirname, '..', 'uploads', 'pgn');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created directory: ${uploadsDir}`);
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Double check directory exists before saving
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Created directory (from multer): ${uploadsDir}`);
    }
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter to allow only .pgn files
const fileFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === '.pgn') {
    cb(null, true);
  } else {
    cb(new Error('Only .pgn files are allowed!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max file size
});

// Initialize payment
router.post(
  '/initialize', 
  upload.single('pgnFile'), 
  paymentController.initializePayment
);

// Confirm payment (after Razorpay redirect/webhook)
router.post('/confirm', paymentController.confirmPayment);

// Get all payments (admin endpoint)
router.get('/', paymentController.getAllPayments);

// Get payment by ID
router.get('/:id', paymentController.getPaymentById);

module.exports = router;