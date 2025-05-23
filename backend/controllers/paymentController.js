// controllers/payment.controller.js
const Payment = require('../models/Payment');
const path = require('path');
const fs = require('fs');

// Initialize payment (records payment intent)
exports.initializePayment = async (req, res) => {
  try {
    // We're only recording the user's intent to pay here, not processing the payment yet
    const { name, email, amount } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'PGN file is required' });
    }

    // File path where the PGN file is stored after multer middleware processes it
    const pgnFile = req.file.path;

    // Generate a unique payment ID
    const uniquePaymentId = generateUniquePaymentId();

    // Initialize payment record with the unique ID and 'pending' status
    const payment = new Payment({
      name,
      email,
      amount,
      pgnFile,
      paymentId: uniquePaymentId,
      status: 'pending'
    });

    await payment.save();

    res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        uniquePaymentId: payment.paymentId,
        name,
        email,
        amount
      }
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error initializing payment',
      error: error.message
    });
  }
};

function generateUniquePaymentId() {
  // Generate a unique ID with timestamp prefix and random string
  const timestamp = new Date().getTime();
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `PAY-${timestamp}-${randomStr}`;
}

// Confirm payment after Razorpay redirect/webhook
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentId, razorpayPaymentId } = req.body;

    // Find the payment record
    const payment = await Payment.findOne({ paymentId: paymentId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Update payment record with Razorpay payment ID and status
    payment.paymentId = razorpayPaymentId;
    payment.status = 'completed';
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
      error: error.message
    });
  }
};

// Get all payments (admin endpoint)
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// Get payment by ID
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
};