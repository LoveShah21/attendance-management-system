import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOtp from './pages/VerifyOtp';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import PaymentForm from './pages/PaymentForm';
import StudentDashboard from './pages/StudentDashboard';
import CoachDashboard from './pages/CoachDashboard';
import AuthMiddleware from './components/AuthMiddleware';

// admin pages
import AdminLayout from './components/AdminLayout';
import Dashboard from './admin/Dashboard';
import Coaches from './admin/Coaches';
import Students from './admin/Students';
import Salary from './admin/Salary';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/payments" element={<PaymentForm />} />

        {/* Protected routes */}
        <Route path="/profile" element={
          <AuthMiddleware>
            <Profile />
          </AuthMiddleware>
        } />
        <Route path="/student/dashboard" element={
          <AuthMiddleware allowedRoles={['student']}>
            <StudentDashboard />
          </AuthMiddleware>
        } />
        <Route path="/coach/dashboard" element={
          <AuthMiddleware allowedRoles={['coach']}>
            <CoachDashboard />
          </AuthMiddleware>
        } />


        {/* Admin routes (protected by adminMiddleware) */}
        <Route path="/admin/" element={<AdminLayout />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/coaches" element={<Coaches />} />
          <Route path="/admin/students" element={<Students />} />
          <Route path="/admin/salary" element={<Salary />} />
          

        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;