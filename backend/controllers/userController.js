const bcrypt = require('bcryptjs');
// const admin = require('../config/firebaseAdmin');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Coach = require('../models/Coach');
const sendEmail = require('../utils/sendEmail');


// Register User
const registerUser = async (req, res) => {
  const { name, email, phone, password, userType } = req.body;
  
  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const user = await User.create({ 
      name, 
      email, 
      phone, 
      password: hashedPassword,
      userType 
    });

    // Create student or coach profile based on userType
    if (userType === 'student') {
      await createStudentProfile(user);
    } else if (userType === 'coach') {
      await createCoachProfile(user);
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    // Send response
    res.status(201).json({ 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      userType: user.userType,
      token 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Helper function to create student profile
const createStudentProfile = async (user) => {
  try {
    const count = await Student.countDocuments();
    const studentId = `STU${(count + 1).toString().padStart(4, '0')}`;
    
    const student = new Student({
      studentId,
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone
    });

    await student.save();
  } catch (error) {
    console.error('Error creating student profile:', error);
    throw error;
  }
};

// Helper function to create coach profile
const createCoachProfile = async (user) => {
  try {
    const count = await Coach.countDocuments();
    const coachId = `COA${(count + 1).toString().padStart(4, '0')}`;
    
    const coach = new Coach({
      coachId,
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      hourlyRate:1500
    });

    await coach.save();
  } catch (error) {
    console.error('Error creating coach profile:', error);
    throw error;
  }
};



// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate a token with the user's ID
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // Send the token to the client
    res.cookie('auth_token', token, { httpOnly: true, secure: true });
    res.status(200).json({ token, user: { _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, userType: user.userType } });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get current user (protected route)
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};

const updateUser = async (req, res) => {
  const userId = req.user._id;
  const { name, email, lastName, currentPassword, newPassword } = req.body;

  try {
    // Find the user by email
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(200).json({ success: false, passInCorrect: true });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user data
    user.name = name;
    user.lastName = lastName;
    user.email = email;
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: 'An error occurred while updating your profile' });
  }
}

let otpStore = {};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiration (e.g., 5 minutes)
    otpStore[email] = {
      code: otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins in milliseconds
    };

    // Send OTP email
    await sendEmail({
      to: email,
      subject: 'Verification Code',
      html: `
        <h2>Verify Your Identity</h2>
        <p>Please use the following code to verify your identity:</p>
        <h3 style="letter-spacing: 2px;">${otp}</h3>
        <p>This code is valid for 5 minutes.</p>
        <br />
        <p style="color: grey; font-size: 14px;">Please do not share this code with anyone.</p>
        <p>– Aqua Overseas</p>
      `,
    });

    return res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return res.status(500).json({ success: false, message: "Failed to send OTP", error });
  }
};


const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    const storedOtp = otpStore[email];

    // Check if OTP exists and hasn't expired
    if (!storedOtp) {
      return res.status(400).json({ success: false, message: "OTP has expired or was not sent." });
    }

    // Check expiration (if you're storing expiry as in the previous suggestion)
    if (Date.now() > storedOtp.expiresAt) {
      delete otpStore[email]; // Clean up
      return res.status(400).json({ success: false, message: "OTP has expired." });
    }

    // Match OTP
    if (storedOtp.code === otp) {
      delete otpStore[email]; // Clean up after success
      return res.status(200).json({ success: true, message: "OTP verified successfully." });
    } else {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ success: false, message: "Server error during OTP verification." });
  }
};


const resetPass = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, message: "Error resetting password" });
  }
};


module.exports = { registerUser, loginUser, getCurrentUser, updateUser, sendOtp, verifyOtp, resetPass };

