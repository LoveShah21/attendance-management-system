import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    coaches: 0,
    pendingSalary: 0,
    activeSessions: 0,
    loading: true,
    error: null
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        setStats(prev => ({ ...prev, loading: true, error: null }));
        
        const [studentsRes, coachesRes, salaryRes] = await Promise.all([
          axios.get('http://localhost:5000/api/students/count', config),
          axios.get('http://localhost:5000/api/coaches/count', config),
          axios.get('http://localhost:5000/api/salary/total-pending', config)
        ]);
        
        setStats({
          students: studentsRes.data.count,
          coaches: coachesRes.data.count,
          pendingSalary: salaryRes.data.total,
          activeSessions: 0, // You'll need to implement this
          loading: false,
          error: null
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        setStats(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data'
        }));
      }
    };
    
    fetchStats();
  }, []);

  if (stats.loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </AdminLayout>
    );
  }

  if (stats.error) {
    return (
      <AdminLayout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {stats.error}</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.students}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Total Coaches</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.coaches}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Pending Salary</h3>
          <p className="text-3xl font-bold text-indigo-600">₹{stats.pendingSalary.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm font-medium">Active Sessions</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.activeSessions}</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        {/* Add recent activity log here */}
        <p className="text-gray-500">No recent activity</p>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;