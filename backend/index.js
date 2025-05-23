const express = require('express');
const app = express();
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const authRoutes = require('./routes/userRoutes');
const studentRoutes = require('./routes/studentRoutes');
const coachRoutes = require('./routes/coachRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'pgn');
fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



const PORT = process.env.PORT || 8000;

const cors = require('cors');
connectDB();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001'
];

// CORS configuration with multiple origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json());
// Basic route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/payments', paymentRoutes);

// Schedule monthly salary calculation (using node-cron)
if (process.env.NODE_ENV === 'production') {
  const cron = require('node-cron');

  // Run at midnight on the 1st of every month
  cron.schedule('0 0 1 * *', () => {
    require('./controllers/salaryController').calculateMonthlySalaries();
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port:${PORT}`);
});

